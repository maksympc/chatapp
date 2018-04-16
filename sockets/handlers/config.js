var logger = require('../../logger');

var Config = function (sockConfigurationStorage, socket) {

    this.socket = socket;
    this.configuration = sockConfigurationStorage;

    this.handler = {
        'add user': addUser.bind(this),
        'disconnect': disconnect.bind(this),
        'new message': newMessage.bind(this),
        'typing': typing.bind(this),
        'stop typing': stopTyping.bind(this),
        'get users': getUsers.bind(this)
    }
};

// when user connects
function addUser(username) {
    logger.debug('Socket add user:', username);
    var socket = this.socket;
    var configuration = this.configuration;
    socket.on('add user', function (username) {
        logger.debug('Socket #add user inside:', username);
        // we store the username in the socket session for this client
        socket.username = username;
        //upodate global config
        ++configuration.numUser;
        configuration.addedUser = true;

        socket.emit('login', {
            numUsers: configuration.numUsers
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: configuration.numUsers
        });
    });
}

// when the user disconnects.. perform this
function disconnect() {
    logger.debug('Socket disconnect:', this.socket.username);
    var socket = this.socket;
    var configuration = this.configuration;
    this.socket.on('disconnect', function () {
        logger.debug('Socket #disconnect inside:', socket.username);
        if (configuration.addedUser) {
            --configuration.numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: configuration.numUsers
            });
        }
    });
}


// when the client emits 'new message', this listens and executes
function newMessage(data) {
    logger.debug('Socket new message:', data);
    var socket = this.socket;
    var configuration = this.configuration;
    this.socket.on('new message', function (data) {
        logger.debug('Socket #new message inside:', data);
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });
}

// when the client emits 'typing', we broadcast it to others
function typing() {
    var socket = this.socket;
    var configuration = this.configuration;
    this.socket.on('typing', function () {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });
}

// when the client emits 'stop typing', we broadcast it to others
function stopTyping() {
    var socket = this.socket;
    var configuration = this.configuration;

    this.socket.on('stop typing', function () {
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });
}

//TODO: need to implement
function getUsers() {
    logger.debug('Socket #get users');
    var socket = this.socket;
    var configuration = this.configuration;

    this.socket.on('get users', function () {
        socket.broadcast.emit('get all users');
    });

}

module.exports = Config;