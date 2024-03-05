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
		let user = await conn.query(`SELECT id, username, email FROM users WHERE id='${id}'`);
		if (!user[0]?.id) return null;
		return user[0];
	} catch (e) {
		console.error(e);
		return 1;
	} finally {
		if (conn) await conn.end();
	}
}

// 1 - Invalid username or email
// 2 - Invalid password
async function loginUser(username, email, password) {
	let conn;
	try {
		conn = await pool.getConnection();
		let userQuery = await conn.query(`SELECT id, passHash FROM users WHERE username='${username}' OR email='${email}'`);
		const user = userQuery[0];

		if (!user) return 1;

		let validPassword = await argon2.verify(user.passHash, password);

		if (!validPassword) return 2;

		let session = await conn.query(`SELECT accessToken FROM accessTokens WHERE userId='${user.id}'`);

		return session[0];
	} catch (e) {
		console.error(e);
	} finally {
		if (conn) await conn.end();
	}
}

// 1 Invalid accessToken
async function getKhLocks(accessToken) {
	let conn;
	try {
		conn = await pool.getConnection();
		let id = await getSession(accessToken);
		id = id.userId;
		if (!id) return 1;
		let locks = await conn.query(`SELECT * FROM locks WHERE keyholderId='${id}'`);
		locks.forEach(async (lock) => {
			lock = ensureReturn(lock);
			lock.lockee = (await conn.query(`SELECT id, username, isPremium, isMod FROM users WHERE id='${lock.lockeeId}'`))[0];
			lock.keyholder = (await conn.query(`SELECT id, username, isPremium, isMod FROM users WHERE id='${lock.keyholderId}'`))[0];
		});
		return locks;
	} catch (e) {
		console.error(e);
		return 1;
	} finally {
		if (conn) await conn.end();
	}
}

async function getLock(id, accessToken) {
	let conn;
	try {
		conn = await pool.getConnection();
		let lock = await conn.query(`SELECT * FROM locks WHERE id='${id}'`);
		if (!lock[0]?.id) return null;
		lock = ensureReturn(lock[0]);
		lock.authorized = false;
		if (accessToken) {
			const session = await getSession(accessToken);

			if (lock.keyholderId == session.userId) lock.authorized = true;
		}
		lock.lockee = (await conn.query(`SELECT id, username, isPremium, isMod FROM users WHERE id='${lock.lockeeId}'`))[0];
		lock.keyholder = (await conn.query(`SELECT id, username, isPremium, isMod FROM users WHERE id='${lock.keyholderId}'`))[0];

		return lock;
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
		if (!session[0]?.accessToken) return null;
		return session[0];
	} catch (e) {
		console.error(e);
		return 1;
	} finally {
		if (conn) await conn.end();
	}
}

// 1 - Not an object!
// 2 - Unable to get duration limits
// 3 - Invalid accessToken
async function startLock(lock, accessToken) {
	let conn;
	try {
		if (typeof lock != "object") return 1;
		if (!lock.minDuration || !lock.maxDuration) return 2;

		// Get lockee from access Token
		let lockeeId = await getSession(accessToken);
		if (!lockeeId) return 3;
		lockeeId = lockeeId.userId; //Get the userId from session

		const createdAt = new Date().getTime(); // Get current time
		// Calculate a random date in the future within the min and max time
		const endsAt = Math.round((lock.maxDuration - lock.minDuration) / (Math.random() + Math.random() * 50 + 1)) + createdAt + parseInt(lock.minDuration);

		// Generate an ID
		let id = await ensureUniqueLockId(timedStringGen(30));

		let timerVisible = lock.timerVisible ?? true;
		let mustEndAt = lock.mustEndAt ?? null;

		let status = "locked";

		conn = await pool.getConnection();
		let response = await conn.query(`INSERT INTO locks (id, createdAt, endsAt, mustEndAt, timerVisible, status, lockeeId) VALUES ('${id}', ${createdAt}, ${endsAt}, ${mustEndAt}, ${timerVisible}, '${status}', '${lockeeId}') RETURNING *`);

		response = ensureReturn(response[0]);

		return response;
	} catch (e) {
		console.error(e);
	} finally {
		if (conn) await conn.end();
	}
}

// 1 - Lock not found
// 2 - Not authorized
async function toggleLockTimer(lockId, newState, accessToken) {
	let conn;
	try {
		const lock = await getLock(lockId);
		if (!lock) return 1;

		if (lock.keyholderId && lock.keyholderId != accessToken) return 2;
		if (!lock.keyholderId) return 2; // In the future allow extensions to modify

		conn = await pool.getConnection();

		await conn.query(`UPDATE locks SET timerVisible = ${newState} WHERE id = '${lockId}'`);

		return await getLock(lockId);
	} catch (e) {
		console.error(e);
	} finally {
		if (conn) await conn.end();
	}
}

// 1 - Lock not found
// 2 - Not authorized
async function toggleFreeze(lockId, newState, accessToken) {
	let conn;
	try {
		const lock = await getLock(lockId);
		if (!lock) return 1;

		if (lock.keyholderId && lock.keyholderId != accessToken) return 2;
		if (!lock.keyholderId) return 2; // In the future allow extensions to modify

		conn = await pool.getConnection();

		if (newState == "true") newState = new Date(Date.now()).getTime();
		else newState = null;

		await conn.query(`UPDATE locks SET frozenAt=${newState} WHERE id='${lockId}'`);
		return await getLock(lockId);
	} catch (e) {
		console.error(e);
	} finally {
		if (conn) await conn.end();
	}
}

module.exports = {
	testConnection,
	getUser,
	getLock,
	createUser,
	startLock,
	loginUser,
	toggleLockTimer,
	toggleFreeze,
	getKhLocks,
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

async function ensureUniqueLockId(id) {
	let lock = await getLock(id);
	if (lock == null) return id;
	return ensureUniqueLockId(timedStringGen(30));
}

function ensureReturn(response) {
	response.createdAt = response.createdAt.toString();
	response.endsAt = response.endsAt.toString();
	if (response.mustEndAt) response.mustEndAt = response.mustEndAt.toString();
	if (response.frozenAt) response.frozenAt = response.frozenAt.toString();
	response.timerVisible ? (response.timerVisible = true) : (response.timerVisible = false);

	return response;
}
