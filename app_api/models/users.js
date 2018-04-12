var mongoose = require('mongoose');

//TODO: describe users schema
var usersSchema = new mongoose.Schema(
    {
        email: {type: String, required: true},
        username: {type: String, required: true},
        role: {type: String, required: true, default: 'user'},
        //TODO: hide plain password, will be changed to HASH value
        password: {type: String, required: true},
        mute: {type: Boolean, required: true, default: false},
        ban: {type: Boolean, required: true, default: false},
        online: {type: Boolean, required: true, default: false}
    }
);

mongoose.model('User', usersSchema, 'users');