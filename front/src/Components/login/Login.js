import React, { Component } from 'react';
import { SessionConsumer } from "../../Context/sessionContext";
import Observer from "../../Oberserver/observer";
import sha3 from "sha3";

export class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            "email": "",
            "password": ""
        }
        this.handleChange = this.handleChange.bind(this);
    }
    handleChange(e, key) {
        this.setState({ ...this.state, [(key)]: e.target.value });
    }
    login(e, session) {
        //Getting salt for giving password
        e.preventDefault();
        let url = document.location.href.split("://")[1].split(":")[0];
        fetch(`http://${url}:8081/login/salt`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email }) }).then(r => r.json()).then(data => {
            if (data.msg && data.msg.salt) {
                let sha = new sha3(512);
                let password = sha.update(data.msg.salt + this.state.password + data.msg.salt).digest("hex");
                sha.reset();
                fetch(`http://${url}:8081/login`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email, password }) }).then(r =>
                    console.log(r));
                fetch(`http://${url}:8081/verify`, { credentials: "include" }).then(r => r.json()).then(console.log);
            }
        })
        // let ws = new WebSocket(`ws://${url}:8080`);

        // ws.onclose = () => {
        //     session.closeConnection();
        // }

        // ws.onmessage = (message) => {
        //     let data = JSON.parse(message.data);
        //     if (data.code === 0) {
        //         session.newConnection({ connected: true, connection: ws, UUID: data.UUID });
        //         ws.send(JSON.stringify({ "sender": data.UUID, "message": "message received", "code": 4 }));
        //     } else {
        //         Observer.emit(JSON.parse(message.data));
        //     }
        // }
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
