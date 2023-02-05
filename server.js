/* eslint-disable no-console */
import http from 'http';
import app from "./src/app.js";

const port = process.env.PORT || 5000;
app.set("port", port);

const server = http.createServer(app);
server.listen(port, "127.0.0.1", () => {
  console.log(`Server running on port ${port}`);
});
