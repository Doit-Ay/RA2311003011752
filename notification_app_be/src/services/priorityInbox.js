const { Log } = require("logging-middleware");

const TYPE_WEIGHTS = { Placement: 30, Result: 20, Event: 10 };

function calcPriority(notif) {
  let w = TYPE_WEIGHTS[notif.Type] || 0;
  let ts = new Date(notif.Timestamp).getTime();
  return w + ts / 1e10;
}

// min heap to find top N efficiently
function MinHeap(cap) {
  this.cap = cap;
  this.data = [];
}

MinHeap.prototype.insert = function (item) {
  if (this.data.length < this.cap) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  } else if (item.priority > this.data[0].priority) {
    this.data[0] = item;
    this._sinkDown(0);
  }
};

MinHeap.prototype._bubbleUp = function (i) {
  while (i > 0) {
    let parent = Math.floor((i - 1) / 2);
    if (this.data[parent].priority > this.data[i].priority) {
      let tmp = this.data[parent];
      this.data[parent] = this.data[i];
      this.data[i] = tmp;
      i = parent;
    } else break;
  }
};

MinHeap.prototype._sinkDown = function (i) {
  let smallest = i;
  let left = 2 * i + 1;
  let right = 2 * i + 2;
  if (left < this.data.length && this.data[left].priority < this.data[smallest].priority)
    smallest = left;
  if (right < this.data.length && this.data[right].priority < this.data[smallest].priority)
    smallest = right;
  if (smallest !== i) {
    let tmp = this.data[smallest];
    this.data[smallest] = this.data[i];
    this.data[i] = tmp;
    this._sinkDown(smallest);
  }
};

MinHeap.prototype.sorted = function () {
  return this.data.slice().sort(function (a, b) { return b.priority - a.priority; });
};

async function getPriorityInbox(notifications, n) {
  n = n || 10;
  await Log("backend", "info", "service", "computing priority for top " + n);

  let heap = new MinHeap(n);
  for (let i = 0; i < notifications.length; i++) {
    let scored = Object.assign({}, notifications[i], {
      priority: calcPriority(notifications[i]),
    });
    heap.insert(scored);
  }

  let result = heap.sorted();
  await Log("backend", "info", "service", "priority inbox done: " + result.length + " items");
  return result;
}

module.exports = { getPriorityInbox, calcPriority, TYPE_WEIGHTS };
