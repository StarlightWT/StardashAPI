const { createUser } = require("../../src/databaseHandler");

module.exports = (req, res) => {
	const { username, password, email } = req.body;
	if (!username || !password || !email) return res.status(400).send({ message: "Missing/Incorrect data!" });

	createUser({
		username: username,
		password: password,
		email: email,
	}).then((response) => {
		if (response == 1) return res.status(500).send({ message: "Fatal error occured!" });
		if (response == 2) return res.status(403).send({ message: "Username taken!" });
		if (response == 3) return res.status(403).send({ message: "Email taken!" });
		return res.status(200).send(response);
	});
};
