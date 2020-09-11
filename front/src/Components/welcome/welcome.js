import React, { Component } from "react";
import { withRouter } from "react-router-dom";
// import styles from "./welcome.module.scss";

class Login extends Component {
    render() {
        return (
            <div>
                <button onClick={() => this.props.history.push("/login")}>Iniciar Sesión</button>
                <button onClick={() => this.props.history.push("/register")}>Registrarse</button>
            </div>
        );
    }
}

export default withRouter(Login);