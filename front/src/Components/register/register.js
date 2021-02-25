import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import styles from "./welcome.module.scss";
import { SessionConsumer } from "../../Context/sessionContext";
import Popup from "../popup/popup";
import sha3 from "sha3";

class Welcome extends Component {
	constructor(props) {
		super(props);
		this.state = {
			"name": "",
			"email": "",
			"password": "",
			"status": null
		}
		this.register = this.register.bind(this);
	}
	handleChange(e, key) {
		this.setState({ ...this.state, [(key)]: e.target.value });
	}

	//Send a registration petition to server
	register(e, session) {
		e.preventDefault();
		if (this.state.email && this.state.password && this.state.name) {
			let sha = new sha3(512);
			let salt = session.generateUUID();
			let password = sha.update(salt + this.state.password + salt).digest("hex");
			sha.reset();
			let url = document.location.href.split("://")[1].split(":")[0];
			fetch(`http://${url}:8081/register`, { method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ UUID: session.generateUUID(), name: this.state.userName, email: this.state.email, password, salt }) }).then(d => d.json()).then(data => {
				if (data.code !== 100)
					this.setState({ ...this.state, status: { msg: data.msg, f: () => this.setState({ ...this.state, status: null }) } });
				else
					this.setState({ ...this.state, status: { msg: data.msg, f: () => this.props.history.push("/") } });
			}).catch(e => console.log(e));
		}
	}

	render() {
		return (
			<div>
				{this.state.status ? <Popup message={this.state.status.msg} close={this.state.status.f} /> : false}
				<SessionConsumer>
					{
						(session) => {
							return (
								<>
									<img className="logo" src="/logo.svg" alt="logo" />
									<form className={styles.login}>
										<label htmlFor="name">Name</label>
										<input id="name" placeholder="Insert name" type="text" onChange={(e) => this.handleChange(e, "name")} value={this.state.name} />
										<label htmlFor="email">Email</label>
										<input id="email" placeholder="Insert email" type="text" onChange={(e) => this.handleChange(e, "email")} value={this.state.email} />
										<label htmlFor="password">Password</label>
										<input id="password" placeholder="Insert password" type="password" onChange={(e) => this.handleChange(e, "password")} value={this.state.password} />

										<div className={`${styles.btn} ${styles.secondary}`} style={{ marginRight: "15px" }} onClick={() => this.props.history.push("/")}>
											<p>LOGIN</p>
										</div>
										<div className={`${styles.btn} ${styles.primary}`} onClick={(e) => this.register(e, session)}>
											<p>REGISTER</p>
										</div>
									</form>
								</>
							);
						}
					}
				</SessionConsumer>
			</div>
		);
	}
}

export default withRouter(Welcome);