
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

//Login with jwt
server.get("/jwtLogin", (req, res) => {
	if (req.cookies && req.cookies.jwt) {
		let jwt = req.cookies.jwt;
		let payload = JWT.verifyJWT(jwt);
		if (payload)
			res.send({ msg: "connection stablished", data: payload, code: 200 });
		else
			res.clearCookie("jwt").send({ msg: "invalid JWT provided", code: 303 });
	} else
		res.send({ msg: "no JWT provided", code: 300 })
})
//Generate JWT and give it to front http-only cookies
server.put("/login", (req, res) => {
	if (req.body.user && req.body.password)
		sqlConnection.query(`SELECT name, password, UUID from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
			if (e || !result.length)
				res.send({ msg: "user not found", code: 404 });
			else if (result[0].password == req.body.password) {
				let payload = { "name": result[0].name, "UUID": result[0].UUID, "email": req.body.user };
				res.cookie("jwt", JWT.generateJWT(payload), { secure: false, httpOnly: true }).send({ msg: "connection stablished", data: payload, code: 200 });
			}
			else
				res.send({ msg: "incorret password", code: 303 });
		})
})
//Get salt for given user
server.put("/login/salt", (req, res) => {
	if (req.body.user)
		sqlConnection.query(`SELECT salt from todolist.H_Users WHERE email="${req.body.user}";`, (e, result) => {
			if (e || !result.length)
				res.send({ msg: "user not found", code: 404 });
			else
				res.send({ msg: "salt given", data: result[0], code: 201 });

		});
	else
		res.send({ msg: "no user provided", code: 300 })
});

//LOGOUT
server.get("/logout", (req, res) => {
	res.clearCookie("jwt").send({ msg: "connection ended", code: 202 });
})

//REGISTRATION
server.put("/register", (req, res) => {
	let { UUID, name, email, password, salt } = req.body;
	sqlConnection.query(`INSERT INTO todolist.H_Users(UUID, name, email, password, salt) VALUES("${UUID}", "${name}", "${email}", "${password}", "${salt}")`, (e, result) => {
		if (e)
			if (e.sqlMessage.includes("email"))
				res.send({ msg: "user not created, email already registered", code: 308 });
			else
				res.send({ msg: "user not created, UUID already registered", code: 301 })
		else
			res.send({ msg: "user created", code: 100 });
	});
})

//SHOW THE USERS FOR DEBUGGING
server.get("/", (req, res) => {
	res.send(`<script>console.log(${JSON.stringify(clients)})</script><h1>Usuarios en la consola</h1>`);
})

server.listen(8081, "localhost", (a) => {
	console.log("Express Server started");
});

module.exports = { server };