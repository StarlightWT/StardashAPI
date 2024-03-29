require("dotenv").config();
const cluster = require("cluster");
const os = require("os");

const db = require("./src/databaseHandler");

var maxWorkers = os.cpus().length; // Get how many cores the system has to not try and make too many workers

function _fork(count) {
	for (let i = 0; i < count; i++) {
		if (Object.values(cluster.workers).length < maxWorkers) {
			cluster.fork();
		}
	}
}

cluster.schedulingPolicy = cluster.SCHED_RR;

cluster.setupPrimary({
	exec: "./src/worker.js",
	args: ["--use", "https"],
});

_fork(maxWorkers / 2);

cluster.on("exit", (worker, code, signal) => {
	console.warn(`W:[PR] Worker died [${worker.process.pid}]`);
	if (Object.values(cluster.workers).length < 1) {
		// Always keep at least 1 process running
		_fork(1);
	}
});

cluster.on("message", () => {
	_fork(1);
});

// Run DB connection test
db.testConnection().then((passed) => {
	if (passed) {
		console.log("I:[PR] Database test connection passed!");
	} else {
		console.error("E:[PR] Database connection test failed!");
	}
});
