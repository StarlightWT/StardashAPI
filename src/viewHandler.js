const cookieParser = require("cookie-parser");
const { getLock } = require("./databaseHandler");

module.exports = (app) => {
	app.use(cookieParser());

	app.get("/locks/:id", (req, res) => {
		const { id } = req.params;

		const accessToken = req.cookies.token ?? null;

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
		res.render("home");
	});

	app.get("/login", (req, res) => {
		res.render("login");
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
