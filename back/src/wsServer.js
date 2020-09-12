const { verifyJWT } = require("./jwt");

require("dotenv").config();
const JWT = require("./jwt");

const https = require("https");
const fs = require("fs");
const key = fs.readFileSync("./certs/key.pem");
const cert = fs.readFileSync("./certs/cert.pem")
/*
WebSockets SERVER
*/
const WebSocket = require("ws");
const httpsServer = https.createServer({ key, cert });
const port = 8080;
const server = new WebSocket.Server({ server: httpsServer });

const clients = {};

/*
	WS LISTENERS
*/
server.on("connection", (client, req) => {
	let jwt = (req.headers.cookie.split("; ").map(cookie => cookie.split("=")).filter(el => el[0] === "jwt"))[0];
	jwt = jwt ? jwt[1] : null;
	let payload = JWT.verifyJWT(jwt);
	if (!payload)
		client.close();
	else {
		payload = JSON.parse(payload);
		if (clients[payload.UUID] === undefined) {
			clients[payload.UUID] = [];
		}
		clients[payload.UUID].push(client);

		console.log(`${payload.UUID} (${payload.name}) joined the socket (${clients[payload.UUID].length} sessions opened)`);
		client.send(JSON.stringify({ payload, "message": "connection stablished", "code": 0 }))
		client.on("close", () => {
			clients[payload.UUID] = clients[payload.UUID].filter(session => session !== client);
			if (clients[payload.UUID].length === 0)
				delete clients[payload.UUID];
			console.log(`${payload.UUID} (${payload.name}) left the socket ${clients[payload.UUID] ? `(${clients[payload.UUID].length} sessions still opened)` : "(no sessions opened)"}`);
		});

		client.on("message", message => {
			let data = JSON.parse(message);
			if (data.code !== 2 && data.code !== 3)
				console.log(data);
			if (data.code == 1) {
				client.send(JSON.stringify({ "sender": "server", "code": 3, "message": "received" }));
				clients[payload.UUID].forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 2 })) : "");
				// server.clients.forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 2 })) : "");
			}
			if (data.code == 5)
				clients[payload.UUID].forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 6 })) : "");
		});
	}


});

server.on("listening", () => console.log("WebSocket Server started"));

httpsServer.listen(port);