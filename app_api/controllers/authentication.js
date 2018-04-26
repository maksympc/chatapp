//
// This module contains logic for authentication process
//
var logger = require('../../logger');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var updateJsonResponse = function (res, status, data) {
    res.status(status);
    res.json(data);
};

// Handle login action, check POST-request body params, authenticate user and return jwt-token in response or return message with error.
module.exports.login = function (req, res) {

    logger.debug('Authentication controller:#login with params:\n', req.body);

    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var token;

    // is params present?
    if (!username || !email || !password) {
        updateJsonResponse(res, 400, {message: "Can't login user, all fields required!"});
        logger.debug("'Authentication controller: #login: not enough params");
        return;
    }

    // try to find user in DB
    User.findOne({email: email}, function (err, user) {
        logger.debug("Try to find user while logging!");
        if (err) {
            logger.debug("Authentication controller: #login error:", err);
            updateJsonResponse(res, 400, err);
        }

        // If user was not found, create new user
        else if (!user) {
            logger.debug("Authentication controller: #login. User with email:", email, " was not found, create new user.");
            let user = new User();
            user.username = username;
            user.email = email;
            user.setPassword(password);
            user.save(function (err) {
                if (err) {
                    logger.debug("Authentication controller: #login. Can't create user with email:", email, ". Error was occurred:", err);
                    updateJsonResponse(res, 404, err);
                } else {
                    token = user.generateJwt();
                    logger.debug("Authentication controller: #login. User with email:", email, ". was successfully created!");
                    updateJsonResponse(res, 200, {token: token});
                }
            });
        }

        // If present, check credentials
        else {
            passport.authenticate('local', function (err, user, info) {
                if (err) {
                    logger.debug("error is occurred!", err);
                    updateJsonResponse(res, 404, err);
                    return;
                }
                if (user) {
                    // change username and save in DB
                    if (user.username !== username) {
                        user.username = username;
                        user.save(function (err) {
                            if (err) {
                                logger.debug("Authentication controller: #login. Can't create user with email:", email, ". Error was occurred:", err);
                                updateJsonResponse(res, 404, err);
                            }
                        });
                    }
                    // generate jwt-token
                    token = user.generateJwt();
                    logger.debug("Authentication controller: #login. User with email:", email, " was successfully sign in!");
                    updateJsonResponse(res, 200, {token: token});
                } else {
                    logger.debug("Authentication controller: #login. User with email:", email, " has invalid credentials!");
                    updateJsonResponse(res, 404, info);
                }
            })(req, res);
        }
    });
};