/*
	NODEJS CONFIG
*/
require("dotenv").config();

/*
EXPRESS SERVER
*/
const express = require("express")();
const cors = require("cors")
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

express.use(bodyParser.urlencoded());
express.use(bodyParser.json());
express.use(cookieParser());
express.use(cors({
	credentials: true,
	origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
}));
/*
WebSockets SERVER
*/
const WebSocket = require("ws");
const port = 8080;
const server = new WebSocket.Server({ port });

const randexp = require("randexp");
const regex = "[0123456789abcdef]{8}-([0123456789abcdef]{4}-){3}[0123456789abcdef]{8}";
const generator = new randexp(regex);

const clients = {};

/*
	JWT
*/
const base64 = require('base-64');
const crypto = require("crypto");

/*
	SQL
*/
const mysql = require("mysql");
const sqlConnection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	multipleStatements: true
});
sqlConnection.connect(err => {
	if (err)
		throw err;
	console.log("sql connected");
	sqlConnection.query("SHOW DATABASES", (e, result) => {
		if (!result.filter(db => db.Database === "todolist").length)
			sqlConnection.query(`
            CREATE DATABASE todolist;
            CREATE TABLE todolist.H_Users(
            UUID char(32) PRIMARY KEY NOT NULL,
            name varchar(50) NOT NULL,
            email varchar(255) NOT NULL UNIQUE,
            password varchar(128) NOT NULL,
            salt varchar(60) NOT NULL);`, (e, result) => { if (e) throw e });
	});
});

/*
	USER MANAGEMENT
*/

//UUIDS
function generateUUID() {
	return generator.gen();
}

//JWT
function generateJWT(payload) {
	let base64_header = base64.encode(JSON.stringify({ "alg": "HS256", "typ": "JWT" })).replace("=", "").replace("+", "-");
	let base64_payload = base64.encode(JSON.stringify(payload)).replace("=", "").replace("+", "-");
	let secret = process.env.PRIVATE_KEY;
	let signed = crypto.createHmac("sha256", secret).update(`${base64_header}.${base64_payload}`).digest("base64").replace("=", "").replace("+", "-");
	return (`${base64_header}.${base64_payload}.${signed}`);
}

function verifyJWT(jwt) {
	let parts = jwt.split(".");
	let secret = process.env.PRIVATE_KEY;
	if (crypto.createHmac("sha256", `${secret}`).update(`${parts[0]}.${parts[1]}`).digest("base64").replace("=", "").replace("+", "-") == parts[2])
		console.log("good");
	else
		console.log("bad");
	let header = base64.decode(parts[0]);
	let payload = base64.decode(parts[1]);
	console.log(JSON.parse(header), JSON.parse(payload));
}

/*
	EXPRESS ENDPOINTS
*/

//LOGIN
express.put("/login", (req, res) => {
	if (req.body.user && req.body.password)
		sqlConnection.query(`SELECT name, password, UUID from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
			if (e)
				res.send(JSON.stringify({ msg: "user not found", code: 0 }));
			else if (result[0].password == req.body.password) {
				res.cookie("jwt", generateJWT({ "name": result[0].name, "UUID": result[0].UUID, "email": req.body.user }), { secure: false, httpOnly: true })
				res.send(JSON.stringify({ msg: "welcome", code: 1 }))
			}
			else
				res.send(JSON.stringify({ msg: "incorret password", code: 0 }));
		})
})
express.put("/login/salt", (req, res) => {
	if (req.body.user)
		sqlConnection.query(`SELECT salt from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
			if (e || !result.length)
				res.send(JSON.stringify({ msg: "user not found", code: 0 }));
			else
				res.send(JSON.stringify({ msg: result[0], code: 1 }));

		});
	else
		res.send(JSON.stringify({ msg: "No user provided", code: 0 }))
});

//REGISTRATION
express.put("/register", (req, res) => {
	let { UUID, name, email, password, salt } = req.body;
	sqlConnection.query(`INSERT INTO todolist.H_Users(UUID, name, email, password, salt) VALUES("${UUID}", "${name}", "${email}", "${password}", "${salt}")`, (e, result) => {
		if (e)
			res.send({ msg: e.sqlMessage, code: e.code });
		else
			res.send({ msg: "user created", code: 1 });
	});
})

//DEFAULT
express.get("/", (req, res) => {
	res.send(clients);
})

express.listen(8081);


/*
	WS LISTENERS
*/
server.on("connection", client => {
	let UUID = generateUUID();
	while (clients[UUID]) UUID = generateUUID();
	clients[UUID] = client;
	console.log(UUID, "joined the socket");
	client.send(JSON.stringify({ UUID, "message": "connection stablished", "code": 0 }))
	client.on("close", () => {
		delete clients[UUID];
		console.log(UUID, "left the socket");
	});

	client.on("message", message => {
		let data = JSON.parse(message);
		if (data.code !== 2 && data.code !== 3)
			console.log(data);
		if (data.code == 1) {
			client.send(JSON.stringify({ "sender": "server", "code": 3, "message": "received" }));
			server.clients.forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 2 })) : "");
		}
		if (data.code == 5)
			server.clients.forEach(wsClient => wsClient !== client ? wsClient.send(JSON.stringify({ ...data, "code": 6 })) : "");
	});

});

server.on("listening", () => console.log("server started"));