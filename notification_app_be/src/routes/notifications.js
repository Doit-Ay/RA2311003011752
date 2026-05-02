const express = require("express");
const { fetchNotifications } = require("../services/apiClient");
const { getPriorityInbox, TYPE_WEIGHTS } = require("../services/priorityInbox");
const { Log } = require("logging-middleware");

const router = express.Router();

router.get("/notifications", async function (req, res) {
  try {
    await Log("backend", "info", "route", "GET /notifications");
    let notifs = await fetchNotifications();
    await Log("backend", "info", "handler", "returning " + notifs.length + " notifs");
    res.json({ notifications: notifs, total: notifs.length });
  } catch (err) {
    await Log("backend", "error", "handler", "notif fetch failed");
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications/priority", async function (req, res) {
  try {
    let n = parseInt(req.query.n) || 10;
    if (n < 1) n = 1;
    if (n > 100) n = 100;
    await Log("backend", "info", "route", "GET /priority?n=" + n);

    let notifs = await fetchNotifications();
    let ranked = await getPriorityInbox(notifs, n);

    await Log("backend", "info", "handler", "returning top " + ranked.length);

    res.json({
      topN: n,
      typeWeights: TYPE_WEIGHTS,
      priorityNotifications: ranked,
    });
  } catch (err) {
    await Log("backend", "error", "handler", "priority failed");
    res.status(500).json({ error: err.message });
  }
});

router.get("/notifications/type/:type", async function (req, res) {
  try {
    let type = req.params.type;
    let valid = ["Placement", "Result", "Event"];
    if (valid.indexOf(type) === -1) {
      await Log("backend", "warn", "handler", "invalid type: " + type);
      return res.status(400).json({ error: "type must be Placement, Result, or Event" });
    }

    await Log("backend", "info", "route", "GET /type/" + type);
    let notifs = await fetchNotifications();
    let filtered = notifs.filter(function (n) { return n.Type === type; });

    await Log("backend", "info", "handler", filtered.length + " " + type + " notifs");
    res.json({ type: type, notifications: filtered, count: filtered.length });
  } catch (err) {
    await Log("backend", "error", "handler", "filter failed");
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
