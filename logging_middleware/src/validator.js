const {
  VALID_STACKS,
  VALID_LEVELS,
  BACKEND_ONLY_PACKAGES,
  FRONTEND_ONLY_PACKAGES,
  SHARED_PACKAGES,
} = require("./constants");

function getValidPackages(stack) {
  if (stack === "backend") {
    return [...BACKEND_ONLY_PACKAGES, ...SHARED_PACKAGES];
  }
  return [...FRONTEND_ONLY_PACKAGES, ...SHARED_PACKAGES];
}

function validateLogParams(stack, level, pkg, message) {
  if (!stack || !VALID_STACKS.includes(stack)) {
    throw new Error(`Invalid stack "${stack}". Allowed: ${VALID_STACKS.join(", ")}`);
  }

  if (!level || !VALID_LEVELS.includes(level)) {
    throw new Error(`Invalid level "${level}". Allowed: ${VALID_LEVELS.join(", ")}`);
  }

  const allowed = getValidPackages(stack);
  if (!pkg || !allowed.includes(pkg)) {
    throw new Error(`Invalid package "${pkg}" for ${stack}. Allowed: ${allowed.join(", ")}`);
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new Error("Message cannot be empty");
  }
}

module.exports = { validateLogParams, getValidPackages };
