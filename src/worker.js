const cluster = require("cluster");

const ttl = 5;
let requestCounter = 0;

const express = require("express");
const app = express();
const port = 8080;

app.listen(port, () => console.log(`Worker started [${process.pid}] listening on http://localhost:${port}`));

app.use((req, res, next) => {
	requestCounter++;
	if (requestCounter > 15) {
		cluster.worker.send("REQ[Fork]"); // Request a new fork
		console.log(`I: Worker's [${process.pid}] requests per minute = ${requestCounter}`);
	}
	next();
});

setInterval(() => {
	if (requestCounter > 0) requestCounter--;
}, 1000); // 1 second

setTimeout(() => {
	cluster.worker.kill();
}, ttl * 1000 * 60); // ttl = minutes

require("./mainHandler")(app);
