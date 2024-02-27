//Handlers

// Locks
const createLock = require("../handlers/lock/create");
const getLock = require("../handlers/lock/getInfo");

//Users
const getUser = require("../handlers/user/getInfo");
const createUser = require("../handlers/user/create");

module.exports = (app) => {
	// Get requests
	app.get("/v1/locks/:id", (req, res) => getLock(req, res));
	app.get("/v1/users/:id", (req, res) => getUser(req, res));
	// Post requests
	app.post("/v1/locks/create", (req, res) => createLock(req, res));
	app.post("/v1/users/create", (req, res) => createUser(req, res));
	// Patch requests
};
