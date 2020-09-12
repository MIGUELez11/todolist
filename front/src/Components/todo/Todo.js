import React, { Component } from 'react';
import { SessionConsumer } from "../../Context/sessionContext";
import Observer from "../../Oberserver/observer";
import styles from "./Todo.module.scss";

export class Todo extends Component {
    constructor() {
        super();
        this.state = { value: "", messages: [] };
        this.receiveMessage = this.receiveMessage.bind(this);
        Observer.subscribe(this.receiveMessage);
        this.sendMessage = this.sendMessage.bind(this);
    }

	//Input value handler
	handleValue(e) {
        this.setState({ ...this.state, value: e.target.value });
	}
	//Handle if item is selected and send to websocket and its self
	handleCheckbox(message, connection) {
        message = { ...message };
        message.finished = !message.finished;
        connection.addItem(message, 5);
    }
	//WebSocket listener for update items
    receiveMessage(message) {
        let messages = [...this.state.messages];
        if (message.code === 1 || message.code === 2)
            messages = [...this.state.messages, message];
        else if (message.code === 5 || message.code === 6) {
            if (this.state.messages.filter(el => el.id === message.id).length)
                messages = this.state.messages.map(el => {
                    if (el.id === message.id)
                        return message;
                    return el;
                });
            else
                messages = [...this.state.messages, message];

        }
        this.setState({ ...this.state, messages: messages, value: "" });
    }
    
    
	// Send a message to websocket and its self
    sendMessage(connection) {
        if (this.state.value)
            connection.addItem({ "sender": connection.connection.UUID, "code": "1", "message": this.state.value });
    }
    render() {
        return (
            <div>
                <p>Welcome TODO</p>
                <SessionConsumer>
                    {connection => {
                        return (
                            <>
                                <button onClick={() => {localStorage.setItem("logout", true); connection.closeConnection()}} >Log out</button>
                                <input value={this.state.value} onChange={this.handleValue.bind(this)} />
                                <button onClick={() => this.sendMessage(connection)}>Send</button>
                                <div className={styles.viewer}>
                                    {(() => this.state.messages.map((a, id) => ({ message: a, id })).sort((a, b) => a.message.finished && !b.message.finished ? 1 : -1).map((message) => <div key={message.id} onClick={() => this.handleCheckbox(message.message, connection)} className={styles.item + (this.state.messages[message.id].finished === true ? " " + styles.checked : "")}>
                                        <p>{message.message.message}</p>
                                    </div>))()}
                                </div>
                            </>
                        );
                    }}
                </SessionConsumer>
            </div >
        )
    }
}

export default Todo
