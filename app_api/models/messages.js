//
// This module describe Message schema
//
var mongoose = require('mongoose');

// This schema describe message item. Contains email, message, username and createdOn field
var messagesSchema = new mongoose.Schema({
    email: {type: String, required: true},
    message: {type: String, required: true, maxLength: 200},
    username: {type: String, required: true},
    createdOn: {type: Date, default: Date.now}
});

mongoose.model('Message', messagesSchema, 'messages');