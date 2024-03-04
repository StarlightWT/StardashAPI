const { getKhLocks } = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const { authorization } = req.headers;
	if (!authorization) return res.status(400).send({ message: "Missing authorization!" });
	getKhLocks(id).then((response) => {
		return res.status(200).send(response);
	});
};
