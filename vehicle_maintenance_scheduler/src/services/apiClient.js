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

async function fetchDepots() {
  let token = await getToken();
  await Log("backend", "info", "service", "fetching depots");

  let res = await fetch(config.BASE_URL + "/depots", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    await Log("backend", "error", "service", "depot fetch failed " + res.status);
    throw new Error("depot fetch failed");
  }

  let data = await res.json();
  await Log("backend", "info", "service", "got " + data.depots.length + " depots");
  return data.depots;
}

async function fetchVehicles() {
  let token = await getToken();
  await Log("backend", "info", "service", "fetching vehicles");

  let res = await fetch(config.BASE_URL + "/vehicles", {
    headers: { Authorization: "Bearer " + token },
  });
  if (!res.ok) {
    await Log("backend", "error", "service", "vehicle fetch failed " + res.status);
    throw new Error("vehicle fetch failed");
  }

  let data = await res.json();
  await Log("backend", "info", "service", "got " + data.vehicles.length + " vehicles");
  return data.vehicles;
}

module.exports = { fetchDepots, fetchVehicles };
