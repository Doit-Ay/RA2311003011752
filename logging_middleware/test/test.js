const { Log, initLogger } = require("../src/index");

initLogger({
  email: "ay2987@srmist.edu.in",
  name: "aditya yadav",
  rollNo: "ra2311003011752",
  accessCode: "QkbpxH",
  clientID: "4784ee2f-d597-4d43-ba99-268e09d8f624",
  clientSecret: "FwYHpfeVYHQaYeKj",
});

async function test() {
  console.log("running tests...\n");

  try {
    let r = await Log("backend", "info", "service", "User session started");
    console.log("PASS info/service -", r.logID);
  } catch (e) {
    console.log("FAIL info/service -", e.message);
  }

  try {
    let r = await Log("backend", "warn", "route", "deprecated endpoint called");
    console.log("PASS warn/route -", r.logID);
  } catch (e) {
    console.log("FAIL warn/route -", e.message);
  }

  try {
    let r = await Log("backend", "error", "controller", "missing vehicleId in body");
    console.log("PASS error/controller -", r.logID);
  } catch (e) {
    console.log("FAIL error/controller -", e.message);
  }

  try {
    let r = await Log("backend", "debug", "db", "query took 42ms");
    console.log("PASS debug/db -", r.logID);
  } catch (e) {
    console.log("FAIL debug/db -", e.message);
  }

  // should fail - bad stack
  try {
    await Log("mobile", "info", "handler", "bad stack");
    console.log("FAIL - should have rejected bad stack");
  } catch (e) {
    console.log("PASS - rejected bad stack");
  }

  // should fail - bad level
  try {
    await Log("backend", "critical", "handler", "bad level");
    console.log("FAIL - should have rejected bad level");
  } catch (e) {
    console.log("PASS - rejected bad level");
  }

  // should fail - wrong package for stack
  try {
    await Log("backend", "info", "component", "wrong pkg");
    console.log("FAIL - should have rejected pkg");
  } catch (e) {
    console.log("PASS - rejected wrong pkg for backend");
  }

  console.log("\ndone");
}

test();
