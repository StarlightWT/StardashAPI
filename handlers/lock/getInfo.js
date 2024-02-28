const { getLock } = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).send({ message: "Missing lockId!" });
	getLock(id).then((response) => {
		return res.status(200).send(response);
	});
};
