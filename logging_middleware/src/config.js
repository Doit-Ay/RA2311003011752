const config = {
  LOG_API_URL: "http://20.207.122.201/evaluation-service/logs",
  AUTH_API_URL: "http://20.207.122.201/evaluation-service/auth",
  credentials: {
    email: process.env.LOG_EMAIL || "",
    name: process.env.LOG_NAME || "",
    rollNo: process.env.LOG_ROLL_NO || "",
    accessCode: process.env.LOG_ACCESS_CODE || "",
    clientID: process.env.LOG_CLIENT_ID || "",
    clientSecret: process.env.LOG_CLIENT_SECRET || "",
  },
};

module.exports = config;
