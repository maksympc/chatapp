var mongoose = require('mongoose');
var Message = mongoose.model('Message');

module.exports.getAllMessages = function () {
    Message.find().exec(
        function (err, messages) {
            if (err)
                return {"status": false, "message": err};
            else
                return {"status": true, "messageItems": messages};
        }
    );
};

module.exports.addMessage = function (messageItem) {
    if (messageItem.email && messageItem.message) {
        Message.create({
            email: messageItem.email,
            message: messageItem.message,
            createdOn: Date.now()
        }, function (err, message) {
            if (err)
                return {"status": false, "message": err};
            else
                return {"status": true, "messageItem": message};
        });
    } else {
        return {"status": false, "message": "Can't add message. Cause: Not found, email and message is required!"}
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