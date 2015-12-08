
// ===================================================

var $events,

addListener = function(name, callback) {
    // console.log(name, callback)
    $events.on(name, callback);
},

initialize = function (events) {
    $events = events;
},

sendMessage = function (name, data) {
    // console.log(name, data)
    $events.emit(name, data);
};

function setAlarm(timeout) {
    timeout = timeout || (10 * (60 * 1000)); // minutes
    setTimeout(function () {
        console.log('alarm listener: timeout expired');
        sendMessage('timeoutExpired');
        // self.port.emit('timeoutExpired');
    }, timeout);
}

// ===================================================

if (typeof module !== 'undefined') {
    module.exports = {
        initialize: initialize,
        addListener: addListener,
        sendMessage: sendMessage    
    };
}
