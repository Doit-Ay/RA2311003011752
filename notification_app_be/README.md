# Notification App Backend

Fetches notifications and ranks them by priority. Placement notifications are weighted highest, then Result, then Event. Recency also matters.

Uses a min-heap to efficiently find the top N.

## How to run

```
npm install
npm start
```

Runs on port 3002.

## API

- `GET /api/notifications` - all notifications
- `GET /api/notifications/priority?n=10` - top N by priority
- `GET /api/notifications/type/Placement` - filter by type
