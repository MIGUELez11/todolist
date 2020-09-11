import React, { Component } from 'react';
import { SessionConsumer } from "../../Context/sessionContext";
import sha3 from "sha3";

export class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            "userName": "",
            "email": "",
            "password": ""
        }
        this.handleChange = this.handleChange.bind(this);
	}
	//Input value handler
    handleChange(e, key) {
        this.setState({ ...this.state, [(key)]: e.target.value });
	}
	
	//Send a registration petition to server
    register(e, session) {
		e.preventDefault();
		if (this.state.email && this.state.password && this.state.userName)
		{

			let sha = new sha3(512);
			let salt = session.generateUUID();
			let password = sha.update(salt + this.state.password + salt).digest("hex");
			console.log(password.length)
			sha.reset();
			let url = document.location.href.split("://")[1].split(":")[0];
			fetch(`http://${url}:8081/register`, { method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ UUID: session.generateUUID(), name: this.state.userName, email: this.state.email, password, salt }) }).then(d => d.json()).then(d => {
				//TODO
				//Handle server response
				console.log(d)
			});
		}
    }
    render() {
        return (
            <>
                <SessionConsumer>
                    {(session) => {
                        return (
                            <form>
                                <label htmlFor="userName">Username</label>
                                <input id="userName" type="text" value={this.state.userName} onChange={e => this.handleChange(e, "userName")} />
                                <label htmlFor="email">Email</label>
                                <input id="email" type="email" value={this.state.email} onChange={e => this.handleChange(e, "email")} />
                                <label htmlFor="psswd">Password</label>
                                <input id="psswd" type="password" value={this.state.password} onChange={e => this.handleChange(e, "password")} />
                                <button onClick={(e) => this.register(e, session)}>Registrarse</button>
                            </form>
                        )
                    }}
                </SessionConsumer>
            </>
        )
    }
}

export default Register
