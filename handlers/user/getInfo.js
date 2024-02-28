const db = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const { id } = req.params;

	db.getUser(id).then((user) => {
		if (user) return res.status(200).send(user);
		else return res.status(404).send({ message: "User not found!" });
	});
};
