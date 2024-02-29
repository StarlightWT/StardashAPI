const { getLock, loginUser } = require("./databaseHandler");

module.exports = (app) => {
	app.get("/locks/:id", (req, res) => {
		const { id } = req.params;
		getLock(id).then((data) => {
			// let timeRemaining = data.endsAt - Date.now();
			let timeRemaining = data.endsAt - Date.now();
			timeRemaining = getTime(timeRemaining);
			res.render("lock", {
				days: timeRemaining.days,
				hours: timeRemaining.hours,
				minutes: timeRemaining.minutes,
				seconds: timeRemaining.seconds,
				authorized: true,
			});
		});
	});
};

function getTime(timestamp) {
	console.log(timestamp);
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
