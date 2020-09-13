import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import styles from "./welcome.module.scss";
import sha3 from "sha3";
import Popup from "../popup/popup";
const  url = document.location.href.split("://")[1].split(":")[0];

class Welcome extends Component {
	constructor(props) {
		super(props);
		this.state = {
			"email": "",
			"password": "",
			"status": null
		}
		this.login = this.login.bind(this);
	}
	handleChange(e, key) {
        this.setState({ ...this.state, [(key)]: e.target.value });
	}

	//Handle the username + password login and receive jwt
    login(e) {
        //Getting salt for giving password
        e.preventDefault();
        fetch(`http://${url}:8081/login/salt`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email }) }).then(r => r.json()).then(data => {
			if (data.code !== 201)
				this.setState({...this.state, status: {msg: data.msg, f: () => this.setState({...this.state, status: null})}})
			else {
				let salt = data.data.salt;
                let sha = new sha3(512);
                let password = sha.update(salt + this.state.password + salt).digest("hex");
                sha.reset();
                fetch(`http://${url}:8081/login`, { credentials: "include", method: "PUT", headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: this.state.email, password }) }).then(r => r.json()).then(data => {
					if (data.code !== 200)
						this.setState({...this.state, status: {msg: data.msg, f: () => this.setState({...this.state, status: null})}})
					else {
						console.log(data.data);
						document.location = `http://${url}:3000/`;
					}			
				})
            }
        })
        
	}
    render() {
        return (
            <div>
				{this.state.status ? <Popup message={this.state.status.msg} close={this.state.status.f}/> : false}
				<img className="logo" src="/logo.svg" alt="logo" />
				<form className={styles.login}>
					<label htmlFor="email">Email</label>
					<input id="email" placeholder="Insert email" type="text" onChange={(e) => this.handleChange(e, "email")} value={this.state.email}/>
					<label htmlFor="password">Password</label>
					<input id="password" placeholder="Insert password" type="password" onChange={(e) => this.handleChange(e, "password")} value={this.state.password}/>

					<div className={`${styles.btn} ${styles.secondary}`} style={{marginRight: "15px"}} onClick={() => this.props.history.push("/register")}>
						<p>REGISTER</p>
					</div>
					<div className={`${styles.btn} ${styles.primary}`} onClick={this.login}>
						<p>LOGIN</p>
					</div>
				</form>
            </div>
        );
    }
}

export default withRouter(Welcome);