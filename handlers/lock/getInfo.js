module.exports = (req, res) => {
	const { lockId } = req.params;
	const authToken = req.headers["authorized"];

	if (!authToken)
		return res.status(400).send({
			message: "Missing authentication token!",
		});

	// TODO get lock info from DB and return it
	res.status(200).send({ message: `Good job! ${process.pid}` });
};
