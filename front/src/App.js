import React from 'react';
import Welcome from "./Components/welcome/welcome";
import { Todo } from "./Components/todo/Todo";
import { SessionProvider } from "./Context/sessionContext";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Register from "./Components/register/Register";
import Login from "./Components/login/Login";
import randexp from "randexp";
import observer from './Oberserver/observer';

class App extends React.Component {
  constructor() {
    super();
    this.state = { connection: null };
  }

  generateUUID() {
    return new randexp("[0123456789abcdef]{8}-([0123456789abcdef]{4}-){3}[0123456789abcdef]{8}").gen();
  }

  newConnection(connection) {
    this.setState({ ...this.state, connection });
  }

  closeConnection() {
    if (this.state.connection.connection.OPEN)
      this.state.connection.connection.close();
    this.setState({ ...this.state, connection: null });
  }

  addItem(message, code = 1) {
    let msg = JSON.stringify({ ...message, id: message.id || this.generateUUID(), code })
    this.state.connection.connection.send(msg);
    observer.emit(JSON.parse(msg));
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
                <Route path="/login">
                  <Login />
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
