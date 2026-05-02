const express = require("express");
const { fetchDepots, fetchVehicles } = require("../services/apiClient");
const { knapsack } = require("../services/knapsack");
const { Log } = require("logging-middleware");

const router = express.Router();

router.get("/schedule", async function (req, res) {
  try {
    await Log("backend", "info", "route", "GET /schedule");

    let depots = await fetchDepots();
    let vehicles = await fetchVehicles();

    await Log("backend", "info", "handler", "running knapsack for " + depots.length + " depots");

    let results = [];
    for (let depot of depots) {
      let result = knapsack(vehicles, depot.MechanicHours);
      results.push({
        depotId: depot.ID,
        mechanicHoursAvailable: depot.MechanicHours,
        hoursUsed: result.totalDuration,
        totalImpact: result.totalImpact,
        selectedVehicles: result.selectedVehicles,
        vehicleCount: result.selectedVehicles.length,
      });
    }

    await Log("backend", "info", "handler", "schedule done for all depots");
    res.json({ schedules: results });
  } catch (err) {
    await Log("backend", "error", "handler", "schedule failed: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/schedule/:depotId", async function (req, res) {
  try {
    let depotId = parseInt(req.params.depotId);
    if (isNaN(depotId)) {
      await Log("backend", "warn", "handler", "bad depot id");
      return res.status(400).json({ error: "depotId must be a number" });
    }

    await Log("backend", "info", "route", "GET /schedule/" + depotId);

    let depots = await fetchDepots();
    let vehicles = await fetchVehicles();

    let depot = depots.find(function (d) { return d.ID === depotId; });
    if (!depot) {
      await Log("backend", "warn", "handler", "depot not found: " + depotId);
      return res.status(404).json({ error: "depot not found" });
    }

    let result = knapsack(vehicles, depot.MechanicHours);

    await Log("backend", "info", "handler", "schedule for depot " + depotId + " done");

    res.json({
      depotId: depot.ID,
      mechanicHoursAvailable: depot.MechanicHours,
      hoursUsed: result.totalDuration,
      totalImpact: result.totalImpact,
      selectedVehicles: result.selectedVehicles,
      vehicleCount: result.selectedVehicles.length,
    });
  } catch (err) {
    await Log("backend", "error", "handler", "depot schedule failed: " + err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
