var logger = require('../../logger');
var mongoose = require('mongoose');
var Message = mongoose.model('Message');

//ok
module.exports.getAllMessages = async () => {
    try {
        let messages = await Message.find({}, 'username email message createdOn -_id').exec();
        logger.debug("#getAllMessages, messages:", JSON.stringify(messages));
        if (messages)
            return {status: true, messages:{messages}};
        else
            return {status: false, message: "Messages weren't found!"};
    } catch (error) {
        return {status: false, message: error}
    }
};

//ok
module.exports.addMessage = async (messageItem) => {
    try {
        let message = await Message.create({
            email: messageItem.email,
            username: messageItem.username,
            message: messageItem.message,
            createdOn: Date.now()
        });
        if (message)
            return {status: true, message: message};
        else
            return {status: false, message: 'Can\'t add message!'};
    } catch (error) {
        return {status: false, message: error};
    }
};

//ok
module.exports.removeMessages = async () => {
    try {
        await Message.remove();
        let count = await Message.count();
        if (!count)
            return {"status": true, message: "The chat was cleared!"};
        else
            return {"status": false, message: "The chat wasn't cleared!"}
    } catch (error) {
        logger.debug("#removeMessages, catch error:" + JSON.stringify(error));
        return {"status": false, message: error};
    }
};