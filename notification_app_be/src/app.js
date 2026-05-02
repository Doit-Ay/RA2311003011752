const express = require("express");
const config = require("./config");
const { Log, initLogger } = require("logging-middleware");
const { createLoggingMiddleware } = require("logging-middleware/src/expressMiddleware");
const notificationRoutes = require("./routes/notifications");

initLogger(config.credentials);

const app = express();
app.use(express.json());
app.use(createLoggingMiddleware({ stack: "backend" }));

app.use("/api", notificationRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "notification-app-be" });
});

app.listen(config.PORT, () => {
  Log("backend", "info", "config", `Notification service running on port ${config.PORT}`)
    .catch((err) => console.error("Startup log failed:", err.message));
  console.log(`Notification App running at http://localhost:${config.PORT}`);
});
