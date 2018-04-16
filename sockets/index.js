var logger = require('../logger');
var index = {};
var numUsers = 0;

// TODO, продумать события
index.init = function (server) {
    // socket.io setup
    var io = require('socket.io')(server);

    io.on('connection', function (socket) {
        var addedUser = false;

        // when the client emits 'add user', this listens and executes
        socket.on('add user', function (username) {
            logger.debug('Socket #add user:', username);
            if (addedUser) return;
            // we store the username in the socket session for this client
            socket.username = username;
            ++numUsers;
            addedUser = true;
            socket.emit('login', {
                numUsers: numUsers
            });
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('user joined', {
                username: socket.username,
                numUsers: numUsers
            });
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', function () {
            logger.debug('Socket #disconnect:', socket.username);
            if (addedUser) {
                --numUsers;

                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    username: socket.username,
                    numUsers: numUsers
                });
            }
        });

        // when the client emits 'new message', this listens and executes
        socket.on('new message', function (data) {
            logger.debug('Socket #new message:', data);
            // we tell the client to execute 'new message'
            socket.broadcast.emit('new message', {
                username: socket.username,
                message: data
            });
        });


        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', function () {
            socket.broadcast.emit('typing', {
                username: socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', function () {
            socket.broadcast.emit('stop typing', {
                username: socket.username
            });
        });

        // TODO: need to implement
        socket.on('ban user', function () {
            logger.debug('Socket #ban user:', socket.username);
            socket.broadcast.emit('ban user', {username: socket.username})
        });

        // TODO: need to implement
        socket.on('unban user', function () {
            logger.debug('Socket #unban user:', socket.username);
            socket.broadcast.emit('unban user', {username: socket.username})
        });

        // TODO: need to implement
        socket.on('mute user', function () {
            logger.debug('Socket #mute user:', socket.username);
            socket.broadcast.emit('mute user', {username: socket.username})
        });

        // TODO: need to implement
        socket.on('unmute user', function () {
            logger.debug('Socket #unmute user:', socket.username);
            socket.broadcast.emit('unmute user', {username: socket.username})
        });

        //TODO: need to implement
        socket.on('get users', function () {
            logger.debug('Socket #get users');
            socket.broadcast.emit('get all users');
        });

    });
};

module.exports = index;