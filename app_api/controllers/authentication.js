var logger = require('../../logger');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var updateJsonResponse = function (res, status, data) {
    res.status(status);
    res.json(data);
};

module.exports.register = function (req, res) {
    logger.debug('Authentication controller:#register with params:', req.body);
    //get request's param
    var username = req.body.username;
    var email = req.body.email;
    let password = req.body.password;

    // check presence of request params
    if (!username || !email || !password) {
        updateJSONresponse(res, 400, {message: "Can't register user, all fields required!"});
        logger.debug('Authentication controller:#register response:', res.body);
        return;
    }

    // create new User
    var user = new User();
    user.username = username;
    user.email = email;
    user.setPassword(password);

    user.save(function (err) {
        var token;
        if (err) {
            updateJsonResponse(res, 404, err);
            logger.debug('Authentication controller:#register response:', res.body);
            return;
        } else {
            token = user.generateJwt();
            logger.debug('Authentication controller:#register response:', res.body);
            updateJsonResponse(res, 201, {"token": token});
        }
    });
    logger.debug('Authentication controller:#register response:', res);
};

module.exports.login = function (req, res) {
    logger.debug('Authentication controller:#login with params:', req.body);
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    // check presence of request params
    if (!username || !email || !password) {
        updateJSONresponse(res, 400, {message: "Can't login user, all fields required!"});
        logger.debug('Authentication controller:#register response:', res.body);
        return;
    }

    passport.authenticate('local', function (err, user, info) {
        var token;
        // If error occurred
        if (err) {
            updateJsonResponse(res, 404, err);
            logger.debug('Authentication controller:#register response:', res.body);
            return;
        }
        if (user) {
            token = user.generateJwt();
            updateJsonResponse(res, 200, {token: token});
            logger.debug('Authentication controller:#register response:', res.body);
        } else {
            updateJsonResponse(res, 404, info);
            logger.debug('Authentication controller:#register response:', res.body);
        }
    })(req, res);
    logger.debug('Authentication controller:#register response:', res);
};
