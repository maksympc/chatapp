//TODO: used to work as API with users
var logger = require('../../logger');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var updateJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

module.exports.getAllUsers = function (req, res) {
    logger.debug('====== User controller, #getAllUsers:');
    logger.debug('!!!User:' + JSON.stringify(User.toLocaleString()));

    User.find().exec(
        function (err, users) {
            if (err) {
                updateJsonResponse(res, 404, err);
                return;
            }
            updateJsonResponse(res, 200, users);
        }
    );
};

module.exports.banUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {ban: true}}, {new: true},
            function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    updateJsonResponse(res, 201, user);
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't ban user. Cause: Not found, email is required!"});
    }
};

module.exports.unbanUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {ban: false}}, {new: true},
            function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    updateJsonResponse(res, 201, user);
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't unban user. Cause: Not found, email is required!"});
    }
};

module.exports.muteUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {mute: true}}, {new: true},
            function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    updateJsonResponse(res, 201, user);
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't mute user. Cause: Not found, email is required!"});
    }
};

module.exports.unmuteUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {mute: false}}, {new: true},
            function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    updateJsonResponse(res, 201, user);
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't unmute user. Cause: Not found, email is required!"});
    }
};
