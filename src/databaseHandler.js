const mariadb = require("mariadb");

const pool = mariadb.createPool({
	host: process.env.DB_SERVER_IP,
	user: process.env.DB_ROLE,
	password: process.env.DB_PASSWORD,
	connectionLimit: 5,
});

async function testConnection() {
	let conn;
	try {
		conn = await pool.getConnection();
		const test = await conn.query("SELECT *");
		console.log(test);
		return 1;
	} catch (e) {
		console.error(e);
		return 0;
	} finally {
		if (conn) return conn.end();
	}
}

module.exports = {
	testConnection,
};
