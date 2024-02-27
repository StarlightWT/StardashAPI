const db = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const { id } = req.params;

	// TODO get data from DB and return the data
	db.getUser(id).then((user) => {
		if (user) res.status(200).send(user);
		else res.sendStatus(404).send({ message: "User not found!" });
	});
};
