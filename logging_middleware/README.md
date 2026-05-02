# Logging Middleware

Reusable logging package. Sends structured logs to the evaluation service.

## Usage

```js
const { Log, initLogger } = require("logging-middleware");

initLogger({
  email: "your@email.com",
  name: "name",
  rollNo: "roll",
  accessCode: "code",
  clientID: "id",
  clientSecret: "secret",
});

await Log("backend", "info", "service", "something happened");
```

## Express middleware

```js
const { createLoggingMiddleware } = require("logging-middleware/src/expressMiddleware");
app.use(createLoggingMiddleware({ stack: "backend" }));
```

## Allowed values

Stack: `backend`, `frontend`

Level: `debug`, `info`, `warn`, `error`, `fatal`

Backend packages: `cache`, `controller`, `cron_job`, `db`, `domain`, `handler`, `repository`, `route`, `service`

Frontend packages: `api`, `component`, `hook`, `page`, `state`, `style`

Shared: `auth`, `config`, `middleware`, `utils`
