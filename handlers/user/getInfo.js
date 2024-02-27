module.exports = (req, res) => {
	const { id } = req.params;

	if (!id) {
		return res.status(400).send({
			message: "Missing user ID",
		});
	}
	// TODO get data from DB and return the data
	res.status(200).send({ message: `Good job! ${process.pid}` });
};
