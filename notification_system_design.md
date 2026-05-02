# Notification System Design

## Stage 1

A frontend developer needs REST APIs to show notifications to logged-in users. Here's the API contract I came up with.

### Endpoints

**Get notifications for a user:**
```
GET /api/v1/notifications?page=1&limit=20&type=Placement&isRead=false
```

Response:
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem",
      "timestamp": "2026-04-22T17:51:30",
      "isRead": false
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150 }
}
```

**Get one notification:**
```
GET /api/v1/notifications/:id
```

**Mark one as read:**
```
PATCH /api/v1/notifications/:id/read
```
Returns `{ "id": "...", "isRead": true }`

**Mark all as read:**
```
PATCH /api/v1/notifications/read-all
```

**Get unread count:**
```
GET /api/v1/notifications/unread-count
```
Returns `{ "count": 7 }`

**Delete a notification:**
```
DELETE /api/v1/notifications/:id
```

All endpoints need `Authorization: Bearer <token>` header.

### Real-time mechanism

I would go with SSE (Server-Sent Events) for real-time notifications.

```
GET /api/v1/notifications/stream
```

Reason: notifications only flow from server to client, so we don't need the full bidirectional capability of WebSockets. SSE is simpler to implement, works over regular HTTP, and handles reconnection automatically. On the backend side, when a new notification gets created we can use an EventEmitter (or Redis pub/sub if we have multiple server instances) to push it out to all connected clients.

---

## Stage 2

### Why PostgreSQL

Going with PostgreSQL here. The data is clearly relational - students have notifications, notifications have types. We need proper transactions for things like marking notifications as read, and Postgres has great indexing which we'll need for the query patterns.

### Schema

```sql
CREATE TYPE notification_type AS ENUM ('Placement', 'Result', 'Event');

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL REFERENCES students(id),
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_student_unread ON notifications(student_id, is_read, created_at DESC);
```

### Queries

Get paginated notifications:
```sql
SELECT id, type, message, is_read, created_at FROM notifications
WHERE student_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;
```

Mark as read:
```sql
UPDATE notifications SET is_read = TRUE WHERE id = $1 AND student_id = $2;
```

Mark all read:
```sql
UPDATE notifications SET is_read = TRUE WHERE student_id = $1 AND is_read = FALSE;
```

Unread count:
```sql
SELECT COUNT(*) FROM notifications WHERE student_id = $1 AND is_read = FALSE;
```

### Scaling issues

Once the data grows to millions of rows:
- Queries will slow down even with indexes because the table is just too big
- Bulk "mark all read" updates will lock a lot of rows
- Every insert has to update the indexes too

To handle this I'd partition the table by `created_at` (maybe monthly). Old notifications that nobody looks at can be moved to a separate archive table. If read traffic is high, adding a read replica would help too.

---

## Stage 3

### Analyzing the slow query

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

Problems with this:
1. `SELECT *` is pulling every column when we probably only need a few for the list view
2. Without a proper index, the database is scanning the entire 5 million row table
3. There's no LIMIT so it returns every single unread notification for this student

Here's what I'd change:
```sql
SELECT id, type, message, created_at FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC LIMIT 20;
```

And create this composite index:
```sql
CREATE INDEX idx_student_unread_recent ON notifications(student_id, is_read, created_at DESC);
```

This index covers the WHERE (student_id + is_read) and the ORDER BY (created_at DESC) so postgres can satisfy the whole query from a single index scan without any additional sorting.

### Index on every column?

No. Bad idea because:
- Every index slows down writes (INSERT/UPDATE have to maintain all indexes)
- Takes up disk space
- Low cardinality columns like `is_read` (only true/false) are useless as standalone indexes
- The query planner might not even use them if they're not selective enough

Better to use composite indexes that match your actual query patterns.

### Students with placement notifications in last 7 days

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement' AND n.created_at >= NOW() - INTERVAL '7 days';
```

An index on `(type, created_at)` would help here.

---

## Stage 4

### The problem

Notifications are being fetched on every page load. With 50k students that's a lot of DB hits, and the UX suffers because of slow queries.

### Solution: Redis caching

I'd use a cache-aside strategy:

1. Student requests notifications -> check Redis first
2. Cache hit -> return directly (no DB call)
3. Cache miss -> query PostgreSQL, put result in Redis with 5min TTL, return to user
4. New notification arrives -> delete that student's cache key

Cache keys:
```
notif:{studentId}:unread -> the notification list (JSON)
notif:{studentId}:count -> just the unread count
```

For the unread count specifically (since it shows in the navbar and needs to be accurate), I'd use a write-through approach - update Redis at the same time as the DB.

The 5 minute TTL is a safety net. Even if our cache invalidation somehow misses, the worst case is 5 minutes of stale data. And we're only caching data for active users, so Redis memory stays reasonable.

The tradeoff is added complexity and the possibility of briefly stale data, but it's way better than the DB falling over under load.

---

## Stage 5

### What's wrong with the current implementation

```
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

This has a bunch of problems:
- If `send_email` fails at student 200, students 201 to 50000 get nothing
- It's doing everything sequentially - 50k emails one by one will take forever
- If the process crashes and restarts, some students might get duplicate emails
- The person who clicked "Notify All" is stuck waiting for all 50k to finish
- Email, DB and push are completely different things but they're all coupled together

### Should email and DB save happen together?

No. DB save is fast and local, email is slow and depends on an external service. If email fails, the notification should still show up in the app. And if the DB save fails, we definitely shouldn't send an email about a notification that doesn't exist. They have different failure modes so they should be handled separately.

### How I'd redesign it

```
function notify_all(student_ids, message):
    notif_id = generate_id()

    // save all notifications to DB in one batch
    batch_insert(student_ids, message, notif_id)

    // queue up the delivery tasks
    for student_id in student_ids:
        queue.push("email_queue", {student_id, message, notif_id})
        queue.push("push_queue", {student_id, message, notif_id})

    return {status: "accepted", notif_id}


// separate worker for emails
email_worker:
    while true:
        task = queue.pop("email_queue")
        try:
            send_email(task.student_id, task.message)
        catch:
            if task.retries < 3:
                queue.push("email_queue", task, delay=backoff)
            else:
                dead_letter_queue.push(task)

// separate worker for push
push_worker:
    // same pattern as email_worker
```

Key improvements: DB save happens first in bulk, delivery is async through a message queue, failed sends get retried with backoff, permanently failed ones go to a dead letter queue for manual review, and the HR gets an immediate response instead of waiting.

---

## Stage 6

### Priority Inbox approach

Each notification type gets a weight: Placement = 30, Result = 20, Event = 10. The priority score is `type_weight + (timestamp_ms / 10^10)`. The timestamp part is normalized so that within the same type, newer ones rank higher, but placement notifications will generally always beat events unless they're really old.

To find the top N efficiently, I use a min-heap of size N. Iterate through all notifications, and for each one, if the heap isn't full just insert it. If it is full and the new item scores higher than the heap's minimum, swap it in. This runs in O(n log k) which is better than sorting everything when we only need the top 10.

For handling new notifications coming in, we just compare against the heap minimum and swap if needed - O(log k) per new notification.

The working code is in `notification_app_be/`.
