const WebSocket = require("ws");
const express = require("express")();
const randexp = require("randexp");
const bodyParser = require("body-parser");
const cors = require("cors")
const mysql = require("mysql");
const port = 8080;
const server = new WebSocket.Server({ port });
const clients = {};
const regex = "[0123456789abcdef]{8}-([0123456789abcdef]{4}-){3}[0123456789abcdef]{8}";
const generator = new randexp(regex);
const sqlConnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    multipleStatements: true
})
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
express.use(cors());

function generateUUID() {
    return generator.gen();
}

express.put("/login", (req, res) => {
    if (req.body.user && req.body.password)
        sqlConnection.query(`SELECT password from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
            if (e)
                res.send(JSON.stringify({ msg: "user not found", code: 0 }));
            else if (result[0].password == req.body.password)
                res.send(JSON.stringify({ msg: "welcome", code: 1 }))
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