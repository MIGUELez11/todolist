# WebSocket server info #

## HOW TO ESTABLISH CONNECTION: ##

 connect to this ws and receive message:
 { UUID, "message": "connection stablished", "code": 0 }
 The UUID will be your connection identifier, which you need to use
 on your comunications

## HOW TO SEND A MESSAGE: ##

 To send a message, you will always need to send a json with the following
 keys:

 { "sender": UUID, "code": 1, "message": "your message" }


# How to generate certificates #

```bash
mkdir certs;
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -subj "/C=SP/ST=Spain/L=Madrid/O=42/CN=127.0.0.1" -keyout certs/server.key -out certs/server.crt;
openssl rsa -in certs/server.key -text > certs/key.pem     
openssl x509 -inform PEM -in certs/server.crt > certs/cert.pem
```

# Create a .env #

The .env must have at least:

```.env
PRIVATE_KEY=
DB_HOST=
DB_USER=
DB_PASS=
```

Put the values that match your database and a private_key.

You can generate a private_key with:
```js
console.log(require("crypto").randomBytes(64).toString("hex"));
```


# MESSAGE CODES #

### EXPRESS CODES ###


	/jwLogin

	validJWT   -> {msg: "connection stablished", code: 200,data: payload}
	invalidJWT -> {msg: "invalid JWT provided", code: 303} REMOVE COOKIE jwt
	noJWT      -> {msg: "no JWT provided", code: 300}


	/login

	userNotFound		-> {msg: "user not found", code: 404}
	loggedIn	 		-> {msg: "connection stablished", code: 200, data: payload} SET COOKIE jwt
	incorretPassword	-> {msg: "invalid password", code: 303}


	/login/salt

	userNotFound		-> {msg: "user not found", code: 404}
	saltGiven			-> {msg: "salt given", code: 201, data: salt}
	NoUserProvided		-> {msg: "no user provided", code: 300}


	/logout

	loggedOut			-> {msg: "connection ended", code: 202} REMOVE COOKIE jwt


	/register

	UUIDChanged				-> {msg: "user not created, UUID already registered", code: 301, UUID}
	EmailAlreadyRegistered	-> {msg: "user not created, email already registered", code: 308}
	UserCreated				-> {msg: "user created", code: 100}



### WEBSOCKET CODES ###

	onConnection

	noJWT					-> {sender: "server", code: 1300, msg: "no JWT provided"}
	inValidJWT				-> {sender: "server", code: 1303, msg: "invalid JWT provided"} REMOVE COOKIE jwt
	connectionStablished	-> {sender: "server", code: 1200, msg: "connection stablished", payload}


	onMessage (server)

	messageReceived			-> {sender: "server", code: 1100, msg: "message received"}	//Send to sender
	messageRebroadcasted	-> {sender: originalSender, id: originalId, code: 1101, msg: originalMessage}		//Send to everyone except sender
	ActionRebroadcasted		-> {sender: originalSender, id: originalID, code: 1102, msg: originalMessage}		//Send to everyone except sender


	onMessage (client)


	messageReceived			-> {sender: UUID, id: messageId, code: 2100, msg: "message received"}
	newMessage				-> {sender: UUID, id: messageId, code: 2101, msg: mesage}
	UpdateMessage			-> {sender: UUID, id: messageId, code: 2102, msg: message}


### DESARROLLO ###
	AUTORIZACIÓN
		ALLOWED		2XX
		FORBIDDEN	3XX
	USER MANAGEMENT
		SUCCESS		1XX
		FAIL		3XX
		NOT FOUND	404

	WEBSOCKET
		MESSAGE BY SERVER	1XXX
		MESSAGE BY USER		2XXX