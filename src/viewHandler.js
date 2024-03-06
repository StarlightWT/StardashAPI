const cookieParser = require("cookie-parser");
const { getLock, getKhLocks, getSession, createUser } = require("./databaseHandler");

module.exports = (app) => {
	app.get("/locks/:id", (req, res) => {
		const { id } = req.params;

		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;

		getLock(id, accessToken).then((data) => {
			if (!data) return res.status(404).render("error");
			let timeRemaining = data.endsAt - Date.now();
			return res.render("lock", {
				timeRemaining: timeRemaining,
				timeCalc: getTime,
				authorized: data.authorized,
			});
		});
	});

	app.get("/", async (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		const userId = (await getSession(accessToken))?.userId;
		if (accessToken && !userId) res.clearCookie("token");

		return res.render("home", {
			authorized: accessToken,
		});
	});

	app.get("/login", (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		if (accessToken) return res.redirect("/dashboard");
		return res.render("login");
	});

	app.get("/signup", (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		if (accessToken) return res.redirect("/dashboard");

		return res.render("signup");
	});

	app.get("/logout", (req, res) => {
		res.clearCookie("token");
		return res.redirect("/");
	});

	app.get("/dashboard", async (req, res) => {
		const accessToken = cookieParser.signedCookie(req.signedCookies.token, process.env.COOKIE_SECRET) ?? null;
		if (!accessToken) return res.redirect("/");
		console.log(accessToken);
		//Get user ID
		const userId = (await getSession(accessToken))?.userId;
		if (!userId) return res.redirect("/");

		//Get KH data
		let locks = await getKhLocks(userId);
		let serializedLocks = locks.map((lock) => JSON.stringify(lock));

		//Get lockee data
		let lock = await getLock(null, accessToken, userId);

		return res.render("dashboard", { authorized: true, role: "switch", locks: serializedLocks, timeCalc: getTime, lock: JSON.stringify(lock) });
	});

	app.get("/discord", (req, res) => {
		return res.redirect("https://discord.gg/8pPyZx4Rr4");
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
