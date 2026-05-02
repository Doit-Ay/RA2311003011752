const config = require("../config");
const { Log, initLogger } = require("logging-middleware");

initLogger(config.credentials);

let tokenCache = null;
let tokenExp = 0;

async function getToken() {
  let now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenExp > now + 60) return tokenCache;

  let res = await fetch(config.BASE_URL + "/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.credentials),
  });
  if (!res.ok) throw new Error("auth failed");

  let data = await res.json();
  tokenCache = data.access_token;
  tokenExp = data.expires_in;
  return tokenCache;
}

async function fetchNotifications() {
  let token = await getToken();
  await Log("backend", "info", "service", "fetching notifications");

  let res = await fetch(config.BASE_URL + "/notifications", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    await Log("backend", "error", "service", "notif fetch failed " + res.status);
    throw new Error("fetch failed: " + res.status);
  }

  let data = await res.json();
  await Log("backend", "info", "service", "got " + data.notifications.length + " notifs");
  return data.notifications;
}

module.exports = { fetchNotifications };
