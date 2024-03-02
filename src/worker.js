const cluster = require("cluster");

const favicon = require("serve-favicon");

const ttl = 5;
let requestCounter = 0;

const express = require("express");
const app = express();
const port = process.env.API_PORT;

app.listen(port, () => console.log(`I:[${process.pid}] listening on http://localhost:${port}`));

app.use(express.json());
app.use(express.static("public"));
app.use(favicon("./public/images/starDashLogoV1.ico"));
app.set("view engine", "pug");

app.use((req, res, next) => {
	requestCounter++;
	if (requestCounter > 15) {
		cluster.worker.send("REQ[Fork]"); // Request a new fork
		console.log(`I:[${process.pid}] requests per minute = ${requestCounter}`);
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
require("./viewHandler")(app);

app.all("*", (req, res) => {
	res.status(400).render("error");
});
