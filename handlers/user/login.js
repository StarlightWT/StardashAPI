const { loginUser } = require("../../src/databaseHandler");

/*
    ?"username":"string" 
    ?"email":"string",
    !"password":"password"
*/
module.exports = (req, res) => {
	const { username, email, password } = req.body;

	if (!username && !email) return res.status(400).send({ message: "Missing email and username! Must send at least one!" });

	loginUser(username, email, password).then((response) => {
		if (response == 1 || response == 2) return res.status(403).send({ message: "Invalid credentials!" });
		return res.status(200).send(response);
	});
};
