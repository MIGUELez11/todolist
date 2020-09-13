import React, { Component } from 'react';
import styles from "./popup.module.scss";

export class Popup extends Component {
	render() {
		return (
			<>
			<div className={styles.cover}/>
			<div className={styles.popup}>
				<img src="/cross.svg" alt="close" onClick={this.props.close}/>
				<p>{this.props.message}</p>
			</div>
			</>
		)
	}
}

export default Popup;
