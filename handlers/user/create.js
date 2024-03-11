const { createUser } = require("../../src/databaseHandler");

module.exports = (req, res) => {
	let { username, password, email } = req.body;
	if (!username || !password || !email) return res.status(400).send({ message: "Missing/Incorrect data!" });

	username = username.toLowerCase();
	email = email.toLowerCase();

	if (!email.includes("@") || !email.includes(".")) return res.status(400).send({ message: "Invalid email!" });

	createUser({
		username: username,
		password: password,
		email: email,
	}).then((response) => {
		if (response == 1) return res.status(500).send({ message: "Fatal error occured!" });
		if (response == 2) return res.status(403).send({ message: "Username taken!" });
		if (response == 3) return res.status(403).send({ message: "Email taken!" });

		let options = {
			maxAge: 1000 * 60 * 60 * 24 * 30 * 2, // would expire after 60 days
			httpOnly: true, // The cookie only accessible by the web server
			signed: true, // Indicates if the cookie should be signed
		};
		res.cookie("token", response[0].accessToken, options);

		return res.status(200).send(response[0]);
	});
};
