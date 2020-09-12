import React, { Component } from 'react';
import { SessionConsumer } from "../../Context/sessionContext";
import Observer from "../../Oberserver/observer";
import sha3 from "sha3";
const  url = document.location.href.split("://")[1].split(":")[0];

export class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            "email": "",
            "password": ""
        }
        this.handleChange = this.handleChange.bind(this);
	}
	//Input value handler
    handleChange(e, key) {
        this.setState({ ...this.state, [(key)]: e.target.value });
	}
	//Handle the username + password login and receive jwt
    login(e, session) {
        //Getting salt for giving password
        e.preventDefault();
        fetch(`http://${url}:8081/login/salt`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email }) }).then(r => r.json()).then(data => {
			if (data.code !== 201)
				console.log(data.msg);
			else {
				let salt = data.data.salt;
                let sha = new sha3(512);
                let password = sha.update(salt + this.state.password + salt).digest("hex");
                sha.reset();
                fetch(`http://${url}:8081/login`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email, password }) }).then(r => r.json()).then(data => {
					if (data.code !== 200)
						console.log(data.msg);	
					else {
						console.log(data.data);
						document.location = `http://${url}:3000/`;
					}			
				})
            }
        })
        
	}
	
	//Setup the ws connection and listeners
	setupWSConnection(session) {
		let ws = new WebSocket(`ws://${url}:8080`);

        ws.onclose = () => {
            session.closeConnection();
        }

        ws.onmessage = (message) => {
            let data = JSON.parse(message.data);
            if (data.code === 0) {
                session.newConnection({ connected: true, connection: ws, UUID: data.UUID });
                ws.send(JSON.stringify({ "sender": data.UUID, "message": "message received", "code": 4 }));
            } else {
                Observer.emit(JSON.parse(message.data));
            }
        }
	}
    render() {
        return (
            <>
                <SessionConsumer>
                    {(session) => {
                        return (
                            <form>
                                <label htmlFor="userName">email</label>
                                <input id="userName" type="email" onChange={(e) => this.handleChange(e, "email")} />
                                <label htmlFor="password">Password</label>
                                <input id="password" type="password" onChange={(e) => this.handleChange(e, "password")} />
                                <button onClick={(e) => this.login(e, session)}>Iniciar Sesión</button>
                            </form>
                        )
                    }}
                </SessionConsumer>
            </>
        )
    }
}

export default Login
