const mariadb = require("mariadb");

const { timedStringGen } = require("./gens/timedStringGen");
const argon2 = require("argon2");

const pool = mariadb.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_ROLE,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
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
		let user = await conn.query(`SELECT * FROM users WHERE id='${id}'`);
		if (!user.id) return null;
		return user;
	} catch (e) {
		console.error(e);
		return 1;
	} finally {
		if (conn) await conn.end();
	}
}

// 1 - Fatal error
// 2 - Username taken
// 3 - Email taken

async function createUser(user) {
	if (!user || typeof user != "object") throw "No user data!";

	if (!user.username || !user.password || !user.email) throw "Missing data!";

	let conn;
	try {
		conn = await pool.getConnection();

		// Check if someone already has the username
		const usernameCheck = await conn.query(`SELECT * FROM users WHERE username='${user.username}'`);
		if (usernameCheck[0]?.id) return 2;

		// Check if someone already used the email
		const emailCheck = await conn.query(`SELECT * FROM users WHERE email='${user.email}'`);
		if (emailCheck[0]?.id) return 3;

		let id = await ensureUniqueId(timedStringGen(40));
		let passHash = await argon2.hash(user.password, { hashLength: 32 });

		// Add user to database
		await conn.query(`INSERT INTO users ( id, username, email, passHash ) VALUES ('${id}', '${user.username}', '${user.email}', '${passHash}')`);

		// Create user accessToken
		let accessToken = await ensureUniqueAccessToken(timedStringGen(70));

		// Save and return accessToken
		return await conn.query(`INSERT INTO accessTokens ( accessToken, userId ) VALUES ('${accessToken}', '${id}') RETURNING accessToken`);
	} catch (e) {
		console.error(e);
	} finally {
		if (conn) await conn.end();
	}
}

async function getSession(token) {
	let conn;
	try {
		conn = await pool.getConnection();
		let session = await conn.query(`SELECT * FROM accessTokens WHERE accessToken='${token}'`);
		if (!session.accessToken) return null;
		return session;
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
	createUser,
};

async function ensureUniqueId(id) {
	let user = await getUser(id);
	if (user == null) return id;
	return ensureUniqueId(timedStringGen(40));
}

async function ensureUniqueAccessToken(token) {
	let session = await getSession(token);
	if (session == null) return token;
	return ensureUniqueAccessToken(timedStringGen(70));
}
