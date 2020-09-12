/*
EXPRESS SERVER
*/
const express = require("express");
const cors = require("cors")
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const sqlConnection = require("./sql").sqlConnection;
const JWT = require("./jwt");

const server = express();
server.use(bodyParser.urlencoded());
server.use(bodyParser.json());
server.use(cookieParser());
server.use(cors({
	credentials: true,
	origin: ["http://localhost:3000", "http://127.0.0.1:3000"]
}));

//LOGIN
server.get("/jwtLogin", (req, res) => {
	if (req.cookies && req.cookies.jwt) {
		let jwt = req.cookies.jwt;
		let payload = JWT.verifyJWT(jwt);
		if (payload)
			res.send({ msg: payload, code: 1 });
		else
			res.send({ msg: null, code: 0 });
	} else
		res.send({ msg: null, code: 0 })
})
server.put("/login", (req, res) => {
	if (req.body.user && req.body.password)
		sqlConnection.query(`SELECT name, password, UUID from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
			if (e)
				res.send(JSON.stringify({ msg: "user not found", code: 0 }));
			else if (result[0].password == req.body.password) {
				let payload = { "name": result[0].name, "UUID": result[0].UUID, "email": req.body.user }
				res.cookie("jwt", JWT.generateJWT(payload), { secure: false, httpOnly: true })
				res.send(JSON.stringify({ msg: payload, code: 1 }))
			}
			else
				res.send(JSON.stringify({ msg: "incorret password", code: 0 }));
		})
})
server.put("/login/salt", (req, res) => {
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

//LOGOUT
server.get("/logout", (req, res) => {
	res.clearCookie("jwt").send({ msg: "bye", code: 1 });
})
//REGISTRATION
server.put("/register", (req, res) => {
	let { UUID, name, email, password, salt } = req.body;
	sqlConnection.query(`INSERT INTO todolist.H_Users(UUID, name, email, password, salt) VALUES("${UUID}", "${name}", "${email}", "${password}", "${salt}")`, (e, result) => {
		if (e)
			res.send({ msg: e.sqlMessage, code: e.code });
		else
			res.send({ msg: "user created", code: 1 });
	});
})

//DEFAULT
server.get("/", (req, res) => {
	res.send(`<script>console.log(${JSON.stringify(clients)})</script><h1>Usuarios en la consola</h1>`);
})

server.listen(8081, "localhost", (a) => {
	console.log("Express Server started");
});

module.exports = { server };