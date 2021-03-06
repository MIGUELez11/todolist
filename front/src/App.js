import React from 'react';
import Welcome from "./Components/welcome/welcome";
import { Todo } from "./Components/todo/Todo";
import { SessionProvider } from "./Context/sessionContext";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
// import Register from "./Components/register/Register";
import Register from "./Components/register/register";
import randexp from "randexp";
import Observer from './Oberserver/observer';
import "./App.css";

class App extends React.Component {
  constructor() {
    super();
	this.state = { connection: null };
	this.tryJWTLogin = this.tryJWTLogin.bind(this);
  }

  generateUUID() {
    return new randexp("[0123456789abcdef]{8}-([0123456789abcdef]{4}-){3}[0123456789abcdef]{8}").gen();
  }

  newConnection(connection) {
    this.setState({ ...this.state, connection });
  }

  closeConnection() {
    if (this.state.connection && this.state.connection.connection.OPEN) {
		this.state.connection.connection.close();
		fetch(`http://${document.location.href.split("://")[1].split(":")[0]}:8081/logout`, {credentials: "include"}).then(d => d.json()).then(data => {
			console.log(data);
		})
	}
	this.setState({ ...this.state, connection: null });
		if (localStorage.jwtSet)
			localStorage.removeItem("jwtSet");
		setTimeout(() => {
			if (localStorage.logout)
			localStorage.removeItem("logout");
		}, 500);
		
  }
  addItem(message, code = 2101) {
    let msg = JSON.stringify({ ...message, id: message.id || this.generateUUID(), code })
    this.state.connection.connection.send(msg);
    Observer.emit(JSON.parse(msg));
  }

  setupWSConnection(session, userData) {
	let ws = new WebSocket(`wss://${document.location.href.split("://")[1].split(":")[0]}:8080`);

	ws.onclose = (ev) => {
		console.log("ws connection closed:", ev.reason);
		session.closeConnection();
	}

	ws.onmessage = (message) => {
		let data = JSON.parse(message.data);
		if (data.code === 1200) {
			session.newConnection({ connected: true, connection: ws, ...userData });
			ws.send(JSON.stringify({ "sender": data.UUID, "message": "message received", "code": 4 }));
		} else {
			Observer.emit(JSON.parse(message.data));
		}
	}
}
  tryJWTLogin() {
	  fetch(`http://${document.location.href.split("://")[1].split(":")[0]}:8081/jwtLogin`, {credentials: "include"}).then(d => d.json()).then(data => {
		if (data.code !== 200)
			console.log(data.msg);
		else {
			this.setupWSConnection({ newConnection: this.newConnection.bind(this), connection: this.state.connection, closeConnection: this.closeConnection.bind(this), addItem: this.addItem.bind(this), generateUUID: this.generateUUID }, JSON.parse(data.data));
			localStorage.setItem("jwtSet", true);
		}
	  	return data.msg;
	  })
  }

  componentDidMount() {
	window.addEventListener("storage", () => {
		console.log("hola")
		if (localStorage.logout === "true")
			this.closeConnection();
		else if (localStorage.jwtSet === "true")
			this.tryJWTLogin();
		console.log("local", localStorage.logout);
	});
	if (!this.state.connection)
		this.tryJWTLogin();
  }
  componentDidUpdate() {
	if (!this.state.connection)
		this.tryJWTLogin();
  }
  render() {
    return (
      <div className="App" >
        <SessionProvider value={{ newConnection: this.newConnection.bind(this), connection: this.state.connection, closeConnection: this.closeConnection.bind(this), addItem: this.addItem.bind(this), generateUUID: this.generateUUID }} >
          {
            <Router>
              <Switch>
                <Route path="/" exact>
                  {!this.state.connection ? <Welcome /> : <Todo />}
                </Route>
                <Route path="/register">
                  <Register />
                </Route>
              </Switch>
            </Router>
          }
        </SessionProvider>
      </div>
    );
  }
}
export default App;
