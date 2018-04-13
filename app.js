// used to load JWT_SECRET token form .env file;
require('dotenv').load();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
// import logger configuration
var logger = require('./logger');
var bodyParser = require('body-parser');
// подключаем passport
var passport = require('passport');

require('./app_api/models/db');
// запрашиваем после подключения моделей, так как они используются при проверке
require('./app_api/config/passport');

//TODO: обновили положение routes
var routes = require('./app_server/routes/index');
var routesApi = require('./app_api/routes/index');

var app = express();

//TODO: обновили положение views
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'jade');

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