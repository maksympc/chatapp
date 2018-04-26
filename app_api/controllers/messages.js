//
// This module contains logic to interact with Message schema
//
var mongoose = require('mongoose');
var messages = mongoose.model('Message');

var updateJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

// Used for API request. Returns all messages in res in json format
module.exports.getAllMessages = function (req, res) {

    messages.find().exec(
        function (err, messages) {
            if (err) {
                updateJsonResponse(res, 404, err);
                return;
            }
            updateJsonResponse(res, 200, messages);
        }
    );

};