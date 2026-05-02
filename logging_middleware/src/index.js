const { validateLogParams } = require("./validator");
const config = require("./config");

let cachedToken = null;
let tokenExpiry = 0;

async function getAuthToken() {
  let now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiry > now + 60) return cachedToken;

  let res = await fetch(config.AUTH_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.credentials),
  });

  if (!res.ok) {
    let err = await res.text();
    throw new Error("Auth failed: " + err);
  }

  let data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = data.expires_in;
  return cachedToken;
}

async function Log(stack, level, pkg, message) {
  validateLogParams(stack, level, pkg, message);
  let token = await getAuthToken();

  let msg = message.length > 48 ? message.substring(0, 48) : message;

  let res = await fetch(config.LOG_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ stack, level, package: pkg, message: msg }),
  });

  if (!res.ok) {
    let body = await res.text();
    throw new Error("Log failed (" + res.status + "): " + body);
  }

  return await res.json();
}

function initLogger(opts) {
  config.credentials = {
    email: opts.email || config.credentials.email,
    name: opts.name || config.credentials.name,
    rollNo: opts.rollNo || config.credentials.rollNo,
    accessCode: opts.accessCode || config.credentials.accessCode,
    clientID: opts.clientID || config.credentials.clientID,
    clientSecret: opts.clientSecret || config.credentials.clientSecret,
  };
  cachedToken = null;
  tokenExpiry = 0;
}

module.exports = { Log, initLogger };
