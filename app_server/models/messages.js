var mongoose = require('mongoose');

//TODO: describe messages schema
var messagesSchema = new mongoose.Schema({
    email: {type: String, required: true},
    message: {type: String, required: true, maxLength: 200},
    createdOn: {type: Date, "default": Date.now}
});