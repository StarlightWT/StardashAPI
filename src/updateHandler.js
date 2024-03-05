const { exec } = require("child_process");
const crypto = require("crypto");

module.exports = (app) => {
	app.post("/update", (req, res) => {
		const hash = req.headers["x-hub-signature-256"];

		if (!hash) return res.sendStaus(403);

		const signature = crypto.createHmac("sha256", process.env.UPDATE_SECRET).update(JSON.stringify(req.body)).digest("hex");
		let trusted = Buffer.from(`sha256=${signature}`, "ascii");
		let untrusted = Buffer.from(req.headers["x-hub-signature-256"], "ascii");

		try {
			if (!crypto.timingSafeEqual(trusted, untrusted)) {
				return res.sendStatus(403);
			}
		} catch (e) {
			return res.sendStatus(403);
		}

		exec("git pull origin main && npm i", (error, stdout, stderr) => {
			console.log(stdout);
		});
		res.sendStatus(200);
	});
};
