require("dotenv").config();
const base64 = require('base-64');
const crypto = require("crypto");
const WebSocket = require("ws");
const express = require("express")();
const randexp = require("randexp");
const bodyParser = require("body-parser");
const cors = require("cors")
const mysql = require("mysql");
const cookieParser = require("cookie-parser");
const port = 8080;
const server = new WebSocket.Server({ port });
const clients = {};
const regex = "[0123456789abcdef]{8}-([0123456789abcdef]{4}-){3}[0123456789abcdef]{8}";
const generator = new randexp(regex);
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
express.use(bodyParser.urlencoded());
express.use(bodyParser.json());
express.use(cookieParser());
express.use(cors({
    credentials: true,
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
}));

function generateUUID() {
    return generator.gen();
}

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

express.get("/verify", (req, res) => {
    console.log(req.cookies);
    if (req.cookies && req.cookies.jwt && verifyJWT(req.cookies.jwt))
        res.status(204).end();
    else
        res.status(400).end();
})

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
express.put("/register", (req, res) => {
    let { UUID, name, email, password, salt } = req.body;
    sqlConnection.query(`INSERT INTO todolist.H_Users(UUID, name, email, password, salt) VALUES("${UUID}", "${name}", "${email}", "${password}", "${salt}")`, (e, result) => {
        if (e)
            res.send({ msg: e.sqlMessage, code: e.code });
        else
            res.send({ msg: "user created", code: 1 });
    });
})

express.get("/", (req, res) => {
    res.send(clients);
})

express.listen(8081);

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


/*
** HOW TO ESTABLISH CONNECTION:
**
** connect to this ws and receive message:
** { UUID, "message": "connection stablished", "code": 0 }
** The UUID will be your connection identifier, which you need to use
** on your comunications
**
** HOW TO SEND A MESSAGE:
**
** To send a message, you will always need to send a json with the following
** keys:
**
** { "sender": UUID, "code": 1, "message": "your message" }
**
**
** Message codes:
**
** 0: connection stablished and UUID sent
** 1: Message sent by client
** 2: Client Message broadcasted by server
** 3: Message sent by server
** 4: Client response to server
** 5: Update from client
** 6: Update broadcasted by server
*/