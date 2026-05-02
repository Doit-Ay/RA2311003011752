const VALID_STACKS = ["backend", "frontend"];

const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];

const BACKEND_ONLY_PACKAGES = [
  "cache", "controller", "cron_job", "db", "domain",
  "handler", "repository", "route", "service",
];

const FRONTEND_ONLY_PACKAGES = [
  "api", "component", "hook", "page", "state", "style",
];

const SHARED_PACKAGES = ["auth", "config", "middleware", "utils"];

module.exports = {
  VALID_STACKS,
  VALID_LEVELS,
  BACKEND_ONLY_PACKAGES,
  FRONTEND_ONLY_PACKAGES,
  SHARED_PACKAGES,
};
