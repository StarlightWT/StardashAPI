//Handlers

// Locks
const createLock = require("../handlers/lock/create");
const getLock = require("../handlers/lock/getInfo");
//Users

module.exports = (app) => {
	app.get("/v1/locks/:id", (req, res) => getLock(req, res));
	app.post("/v1/locks/create", (req, res) => createLock(req, res));
};
