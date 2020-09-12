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


## MESSAGE CODES: ##

 - **0**: connection stablished and UUID sent
 - **1**: Message sent by client
 - **2**: Client Message broadcasted by server
 - **3**: Message sent by server
 - **4**: Client response to server
 - **5**: Update from client
 - **6**: Update broadcasted by server


# How to generate certificates #

```bash
mkdir certs;
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -subj "/C=SP/ST=Spain/L=Madrid/O=42/CN=127.0.0.1" -keyout certs/server.key -out certs/server.crt;
openssl rsa -in certs/server.key -text > certs/key.pem     
openssl x509 -inform PEM -in certs/server.crt > certs/cert.pem
```