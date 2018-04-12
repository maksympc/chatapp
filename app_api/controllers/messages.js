//TODO: used to work as API with messages
var mongoose = require('mongoose');
var messages = mongoose.model('Message');

var updateJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

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

module.exports.addMessage = function (req, res) {

    messages.create({
        email: req.body.messageItem.email,
        message: req.body.messageItem.message,
        createdOn: Date.now()
    }, function (err, message) {
        if (err) {
            updateJsonResponse(res, 400, err);
        } else {
            updateJsonResponse(res, 201, message);
        }
    });

};