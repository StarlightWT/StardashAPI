const { loginUser } = require("../../src/databaseHandler");

/*
    ?"username":"string" 
    ?"email":"string",
    !"password":"password"
*/
module.exports = (req, res) => {
	let { username, email, password } = req.body;

	if (!username && !email) return res.status(400).send({ message: "Missing email and username! Must send at least one!" });

	username = username.toLowerCase();
	email = email.toLowerCase();

	loginUser(username, email, password).then((response) => {
		if (response == 1 || response == 2) return res.status(403).send({ message: "Invalid credentials!" });

		let options = {
			maxAge: 1000 * 60 * 60 * 24 * 30 * 2, // would expire after 60 days
			httpOnly: true, // The cookie only accessible by the web server
			signed: true, // Indicates if the cookie should be signed
		};

		res.cookie("token", response.accessToken, options);

		return res.status(200).send(response);
	});
};
