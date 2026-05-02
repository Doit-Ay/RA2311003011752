const express = require("express");
const config = require("./config");
const { Log, initLogger } = require("logging-middleware");
const { createLoggingMiddleware } = require("logging-middleware/src/expressMiddleware");
const scheduleRoutes = require("./routes/schedule");

initLogger(config.credentials);

const app = express();
app.use(express.json());
app.use(createLoggingMiddleware({ stack: "backend" }));

app.use("/api", scheduleRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "vehicle-maintenance-scheduler" });
});

app.listen(config.PORT, () => {
  Log("backend", "info", "config", `Server running on port ${config.PORT}`)
    .catch((err) => console.error("Startup log failed:", err.message));
  console.log(`Vehicle Maintenance Scheduler running at http://localhost:${config.PORT}`);
});
