const { toggleLockTimer } = require("../../src/databaseHandler");

/* 
    !"newState"="string"
*/
module.exports = (req, res) => {
	const { authorization } = req.headers;
	const { newState } = req.body;
	const { id } = req.params;

	if (!authorization) return res.status(400).send({ message: "Missing authorization" });
	if (!id) return res.status(400).send({ message: "Missing lockId" });
	if (!newState) return res.status(400).send({ message: "Missing newState" });

	toggleLockTimer(id, newState, authorization).then((response) => {
		return res.status(200).send(response);
	});
};
