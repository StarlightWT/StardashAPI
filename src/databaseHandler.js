const mariadb = require("mariadb");

console.log(process.env.DB_SERVER_IP);
const pool = mariadb.createPool({
	host: process.env.DB_SERVER_IP,
	user: process.env.DB_ROLE,
	password: process.env.DB_PASSWORD,
	database: "test",
});

async function testConnection() {
	let conn;
	try {
		conn = await mariadb.createConnection(pool);
		return 1;
	} catch (e) {
		console.error(e);
		return 0;
	} finally {
		if (conn) {
			await conn.end();
		}
	}
}

module.exports = {
	testConnection,
};
