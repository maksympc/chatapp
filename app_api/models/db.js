//
// This module contains logic to describe interaction with MongoDB database via Mongoose
//
var mongoose = require('mongoose');
var logger = require('../../logger');
// Depends on environment variable, use different DB storages
var dbURI = 'mongodb://localhost/chatick';
if (process.env.NODE_ENV === 'production') {
    dbURI = process.env.MONGOLAB_URI;
}
mongoose.connect(dbURI);

mongoose.connection.on('connected', function () {
    logger.debug('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', function (err) {
    logger.debug('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', function () {
    logger.debug('Mongoose disconnected');
});

//Used to close connection between app and DB
var gracefulShutdown;


// To be called when process is restarted or terminated
gracefulShutdown = function (msg, callback) {
    mongoose.connection.close(function () {
        logger.debug('Mongoose disconnected through ' + msg);
        callback();
    });
};

// If nodemon restarts, should close connection
process.once('SIGUSR2', function () {
    gracefulShutdown('nodemon restart', function () {
        process.kill(process.pid, 'SIGUSR2');
    });
});

// If app terminates, should close conncetion
process.on('SIGINT', function () {
    gracefulShutdown('app termination', function () {
        process.exit(0);
    });
});

// For Heroku app termination
process.on('SIGTERM', function () {
    gracefulShutdown('Heroku app termination', function () {
        process.exit(0);
    });
});

// Import schemas, that should be used in applicaton
require('./users');
require('./messages');