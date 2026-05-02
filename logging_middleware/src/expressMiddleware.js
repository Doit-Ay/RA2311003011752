const { Log } = require("./index");

function createLoggingMiddleware(options) {
  let stack = (options && options.stack) || "backend";

  return function (req, res, next) {
    let start = Date.now();

    Log(stack, "info", "middleware", req.method + " " + req.originalUrl)
      .catch(function (err) { console.error("log error:", err.message); });

    let origEnd = res.end;
    res.end = function () {
      let ms = Date.now() - start;
      let lvl = "info";
      if (res.statusCode >= 500) lvl = "error";
      else if (res.statusCode >= 400) lvl = "warn";

      Log(stack, lvl, "middleware", req.method + " " + req.originalUrl + " " + res.statusCode + " " + ms + "ms")
        .catch(function (err) { console.error("log error:", err.message); });

      origEnd.apply(res, arguments);
    };

    next();
  };
}

module.exports = { createLoggingMiddleware };
