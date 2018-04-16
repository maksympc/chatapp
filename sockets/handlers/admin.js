var logger = require('../../logger');

var Admin = function (sockConfigurationStorage, socket) {
    //contains list of all socket connection
    this.configuration = sockConfigurationStorage;
    // contains current socket connection
    this.socket = socket;
    this.handler = {
        'ban user': ban.bind(this),
        'unban user': unban.bind(this),
        'mute user': mute.bind(this),
        'unmute user': unmute.bind(this)
    }
};


// TODO: need to implement
function ban() {
    var socket = this.socket;
    var configuration = this.configuration;

    this.socket.on('ban user', function (email) {
        logger.debug('Socket #ban user:', socket.username);
        socket.broadcast.emit('ban user', {username: socket.username})
    });
}

function unban() {
    this.sockets.on('unban user', function (email) {
        logger.debug('Socket #unban user:', socket.username);
        this.socket.broadcast.emit('unban user', {username: socket.username})
    });
}

function mute() {
    var socket = this.socket;
    var configuration = this.configuration;

    this.socket.on('mute user', function (email) {
        logger.debug('Socket #mute user:', socket.username);
        socket.broadcast.emit('mute user', {username: socket.username})
    });
}

function unmute() {
    this.socket.on('unmute user', function (email) {
        logger.debug('Socket #unmute user:', socket.username);
        socket.broadcast.emit('unmute user', {username: socket.username})
    });
}

module.exports = Admin;