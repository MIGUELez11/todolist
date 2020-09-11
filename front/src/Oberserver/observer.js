let subscribers = [];
let calls = 0;

function unsubscribe(subscriber) {
    subscribers = subscribers.filter(value => value !== subscriber);
}

function subscribe(subscriber) {
    //Avoid v-dom functions
    if (calls % 2 === 1) {
        if (subscribers.filter(value => value === subscriber).length === 0) {
            subscribers.push(subscriber);
        }
    }
    calls++;
}
async function emit(message) {
    subscribers.forEach(f => f(message));
}

export default { unsubscribe, subscribe, emit };