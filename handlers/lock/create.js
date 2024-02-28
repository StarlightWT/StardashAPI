const { startLock } = require("../../src/databaseHandler");

/*
	!"minDuration":"ms"
	!"maxDuration":"ms"
	?"mustEndAt": "timestamp"
	?"timerVisible": "bool"
*/
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
		res.status(200).send(response);
	});
};
