var mongoose = require('mongoose');
var Message = mongoose.model('Message');

module.exports.getAllMessages = function () {
    return Message
        .find()
        .exec()
        .then(messages => {
            if (messages) {
                return {status: true, messages: messages};
            } else {
                return {status: false, message: "Messages weren't found!"}
            }
        })
        .catch(error => {
            return {status: false, message: error}
        });
};

module.exports.addMessage = function (messageItem) {
    if (messageItem.email && messageItem.message) {
        return Message
            .create({
                email: messageItem.email,
                message: messageItem.message,
                createdOn: Date.now()
            })
            .then(message => {
                if (message) {
                    return {status: true, message: message};
                }
            })
            .catch(error => {
                return {status: false, message: error};
            })
    } else {
        return Promise.resolve({
            status: false,
            message: "Can't add message. Cause: Not found, email and message are required!"
        });
    }
};

module.exports.removeAll = function () {
    Message.remove({}, function (err) {
        if (err)
            return {"status": false, "message": err};
        else
            return {"status": true, "message": "The chat was cleared!"}
    })
};