-- CREATE DATABASE
CREATE DATABASE todolist;
USE todolist;

-- Create TABLE
CREATE TABLE H_Users (
    UUID char(32) PRIMARY KEY NOT NULL,
    name varchar(50) NOT NULL,
    email varchar(255) NOT NULL UNIQUE,
    password varchar(50) NOT NULL,
    salt varchar(50) NOT NULL
)