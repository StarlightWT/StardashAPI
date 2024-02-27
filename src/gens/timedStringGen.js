//Final ID |DAY|MONTH|YEAR(last2 digits)|40 random characters
function timedStringGen(length) {
	//Get current date
	const currentDate = new Date(Date.now());

	//Transform into day/month/year
	const currentDay = currentDate.getDate();
	const currentMonth = currentDate.getMonth() + 1;
	const currentYear = currentDate.getFullYear().toString().slice(-2);
	//Generate a random ID [40 characters]
	//Prefix it with current Day, Month and Year
	let id = `${currentDay < 10 ? "0" + currentDay : currentDay}${currentMonth < 10 ? "0" + currentMonth : currentMonth}${currentYear}${charGen(length)}`;

	return id;
}

function charGen(length) {
	let result = "";
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	let counter = 0;
	while (counter < length) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
		counter += 1;
	}
	return result;
}

module.exports = {
	timedStringGen,
};
