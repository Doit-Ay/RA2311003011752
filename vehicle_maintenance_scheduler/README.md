# Vehicle Maintenance Scheduler

Picks the best set of vehicle maintenance tasks for each depot to maximise impact within the mechanic-hours budget. Uses dynamic programming (0/1 knapsack).

## How to run

```
npm install
npm start
```

Runs on port 3001.

## API

- `GET /api/schedule` - schedule for all depots
- `GET /api/schedule/:depotId` - schedule for one depot
