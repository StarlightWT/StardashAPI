const mariadb = require("mariadb");

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_ROLE,
	password: process.env.DB_PASSWORD,
	database: "test",
});

async function testConnection() {
	console.log(`I:[PR] DB IP=${process.env.DB_HOST}`);
	let conn;
	try {
		conn = await pool.getConnection();
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

async function getUser(id) {
	let conn;
	try {
		conn = await pool.getConnection();
		return await conn.query(`SELECT * FROM users WHERE id='${id}'`);
	} catch (e) {
		console.error(e);
		return 1;
	} finally {
		if (conn) await conn.end();
	}
}

module.exports = {
	testConnection,
	getUser,
};
