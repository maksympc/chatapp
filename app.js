//
// This module contains logic, that is used to initialize express app
//

// used to load JWT_SECRET token form .env file;
require('dotenv').load();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('./logger');
var bodyParser = require('body-parser');
var passport = require('passport');


// Initialize DB
require('./app_api/models/db');
// Initialize passport
require('./app_api/config/passport');


// Describe routes, that is used in app
// Used by application itself
var routes = require('./app_server/routes/index');
var routesApi = require('./app_api/routes/index');


// Create express instance
var app = express();


// Change default views folder
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');


// set up app instance
app.use(require('morgan')('combined', {stream: logger.stream}));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use('/', routes);
app.use('/api', routesApi);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});


// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


module.exports = app;