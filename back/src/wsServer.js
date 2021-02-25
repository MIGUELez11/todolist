const { verifyJWT } = require("./jwt");

require("dotenv").config();
const JWT = require("./jwt");
const Express = require("express");
const serverE = Express();
const https = require("https");
const fs = require("fs");
const key = fs.readFileSync("./certs/key.pem");
const cert = fs.readFileSync("./certs/cert.pem")
/*
WebSockets SERVER
*/
const WebSocket = require("ws");
const httpsServer = https.createServer({ key, cert }, serverE);
const port = 8080;

serverE.get("/", (req, res) => res.send("Hola Foris"));
const server = new WebSocket.Server({ server: httpsServer });

const clients = {};

/*
	WS LISTENERS
*/
server.on("connection", (client, req) => {
	let jwt = (req.headers.cookie.split("; ").map(cookie => cookie.split("=")).filter(el => el[0] === "jwt"))[0];
	jwt = jwt ? jwt[1] : null;
	let payload = JWT.verifyJWT(jwt);
	if (!jwt) {
		client.close(1300, "no JWT provided");
		return;
	}
	if (!payload)
		client.close(1303, "invalid JWT provided");
	else {
		payload = JSON.parse(payload);
		if (clients[payload.UUID] === undefined) {
			clients[payload.UUID] = [];
		}
		clients[payload.UUID].push(client);

		console.log(`${payload.UUID} (${payload.name}) joined the socket (${clients[payload.UUID].length} sessions opened)`);
		client.send(JSON.stringify({ payload, "msg": "connection stablished", "code": 1200 }))

		client.on("close", () => {
			clients[payload.UUID] = clients[payload.UUID].filter(session => session !== client);
			if (clients[payload.UUID].length === 0)
				delete clients[payload.UUID];
			console.log(`${payload.UUID} (${payload.name}) left the socket ${clients[payload.UUID] ? `(${clients[payload.UUID].length} sessions still opened)` : "(no sessions opened)"}`);
		});

		client.on("message", message => {
			console.log(message)
			let data = JSON.parse(message);
			if (data.code < 2000 || data.code === 2100)
				console.log(data);
			if (data.code >= 2000)
				client.send(JSON.stringify({ "sender": "server", "code": 1100, "message": "message received" }));
			if (data.code === 2101)
				clients[payload.UUID].forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 1101 })) : "");
			if (data.code === 2102)
				clients[payload.UUID].forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 1102 })) : "");
		});
	}


});

server.on("listening", () => console.log("WebSocket Server started"));

httpsServer.listen(port);