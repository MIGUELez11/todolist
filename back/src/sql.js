require("dotenv").config();
const mysql = require("mysql");
const sqlConnection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	multipleStatements: true
});
sqlConnection.connect((err) => {
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

module.exports = { sqlConnection };