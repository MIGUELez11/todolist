require("dotenv").config();
const base64 = require('base-64');
const crypto = require("crypto");

function parseBase64(str) {
	return str.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

function generateJWT(payload, expire = 1000 * 3600 * 24 * 30 * 2) {
	payload = { ...payload, expire: 0/*expire && new Date(new Date().getTime() + expire).getTime()*/, creation: new Date().getTime() }
	console.log(payload);
	let base64_header = parseBase64(base64.encode(JSON.stringify({ "alg": "HS256", "typ": "JWT" })));
	let base64_payload = parseBase64(base64.encode(JSON.stringify(payload)).toString("base64"));
	let secret = process.env.PRIVATE_KEY;
	let signed = parseBase64(crypto.createHmac("sha256", secret).update(`${base64_header}.${base64_payload}`).digest("base64"));
	return (`${base64_header}.${base64_payload}.${signed}`);
}

function verifyJWT(jwt) {
	if (jwt) {
		let parts = jwt.split(".");
		let secret = process.env.PRIVATE_KEY;
		if (parseBase64(crypto.createHmac("sha256", `${secret}`).update(`${parts[0]}.${parts[1]}`).digest("base64")) == parts[2]) {
			let payload = JSON.parse(base64.decode(parts[1]));
			if (payload && (payload.expire >= new Date().getTime() || payload.expire === 0))
				return JSON.stringify(payload);
		}
	}
	return null;
}

module.exports = { generateJWT, verifyJWT };