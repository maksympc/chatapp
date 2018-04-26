//
// This module contains logic to interact with User schema
//
var mongoose = require('mongoose');
var User = mongoose.model('User');

var updateJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

// Used for API request. Returns all users in res in json format
module.exports.getAllUsers = function (req, res) {

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