function knapsack(vehicles, capacity) {
  let n = vehicles.length;
  let dp = [];
  for (let i = 0; i <= n; i++) {
    dp[i] = new Array(capacity + 1).fill(0);
  }

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (vehicles[i - 1].Duration <= w) {
        let val = dp[i - 1][w - vehicles[i - 1].Duration] + vehicles[i - 1].Impact;
        if (val > dp[i][w]) dp[i][w] = val;
      }
    }
  }

  // backtrack
  let selected = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(vehicles[i - 1]);
      w -= vehicles[i - 1].Duration;
    }
  }

  let totalDur = 0;
  for (let s of selected) totalDur += s.Duration;

  return {
    totalImpact: dp[n][capacity],
    totalDuration: totalDur,
    selectedVehicles: selected,
  };
}

module.exports = { knapsack };
