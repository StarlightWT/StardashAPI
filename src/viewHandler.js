const cookieParser = require("cookie-parser");
const { getLock } = require("./databaseHandler");

module.exports = (app) => {
	app.use(cookieParser(process.env.COOKIE_SECRET));

	app.get("/locks/:id", (req, res) => {
		const { id } = req.params;

		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;

		getLock(id, accessToken).then((data) => {
			if (!data) return res.status(404).render("error");
			let timeRemaining = data.endsAt - Date.now();
			res.render("lock", {
				timeRemaining: timeRemaining,
				timeCalc: getTime,
				authorized: data.authorized,
			});
		});
	});

	app.get("/", (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		res.render("home", {
			authorized: accessToken,
		});
	});

	app.get("/login", (req, res) => {
		let options = {
			maxAge: 1000 * 60 * 60 * 24 * 30 * 2, // would expire after 60 days
			httpOnly: true, // The cookie only accessible by the web server
			signed: true, // Indicates if the cookie should be signed
		};
		res.cookie("token", "270224yldPbCd5UVx2EGQ5Lh3MILmuYAo1MbRF97kI5RopzFBZbEbClnoqm1l6ZpNW0xTpKCVj7u", options);
		res.render("login");
	});

	app.get("/dashboard", (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		if (!accessToken) return res.redirect("/");
	});

	app.get("/discord", (req, res) => {
		res.redirect("https://discord.gg/8pPyZx4Rr4");
	});
};

function getTime(timestamp) {
	let days = 0,
		hours = 0,
		minutes = 0,
		seconds = 0;

	const DAY = 86400000;
	const HOUR = DAY / 24;
	const MINUTE = HOUR / 60;
	const SECOND = MINUTE / 60;

	while (timestamp >= DAY) {
		days++;
		timestamp -= DAY;
	}
	while (timestamp >= HOUR) {
		hours++;
		timestamp -= HOUR;
	}
	while (timestamp >= MINUTE) {
		minutes++;
		timestamp -= MINUTE;
	}
	while (timestamp >= SECOND) {
		seconds++;
		timestamp -= SECOND;
	}

	return { days, hours, minutes, seconds };
}
