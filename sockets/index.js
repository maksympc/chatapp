var logger = require('../logger');
var Admin = require('./handlers/admin');
var Config = require('./handlers/config');

var sockets = {};

// Contains all sockets, that present in app
var sockConfigurationStorage = {
    addedUser: false,
    numUsers: 0,
};

// TODO, продумать события
sockets.init = function (server) {
    // socket.io setup
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {

        // create event handlers for each socket connection
        var handlers = {
            //admin: new Admin(sockConfigurationStorage, socket),
            config: new Config(sockConfigurationStorage, socket)
        };

        for (var category in handlers) {
            var handler = handlers[category].handler;
            for (var event in handler) {
                logger.debug('Subscribe for event:' + event);
                socket.on(event, handler[event]);
            }
        }
    });
};

module.exports = sockets;