const { startLock } = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const authToken = req.headers["authorization"];
	if (!authToken)
		return res.status(400).send({
			message: "Missing authentication token!",
		});

	const { minDuration, maxDuration } = req.body;

	if (!minDuration) return res.status(400).send({ message: "Missing minDuration!" });
	if (!maxDuration) return res.status(400).send({ message: "Missing maxDuration!" });

	startLock(req.body, authToken).then((response) => {
		console.log(response);
		res.sendStatus(200);
	});
};
