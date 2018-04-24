var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

//TODO: describe users schema
var usersSchema = new mongoose.Schema(
    {
        email: {type: String, required: true},
        username: {type: String, required: true},
        role: {type: String, required: true, default: 'user'},
        //password, based on plain password and salt, as output hash value.
        salt: {type: String, required: true},
        hash: {type: String, required: true},
        // statuses
        mute: {type: Boolean, required: true, default: false},
        ban: {type: Boolean, required: true, default: false},
    }
);

usersSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

usersSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
    return this.hash === hash;
};

usersSchema.methods.generateJwt = function (password) {
    var expiry = new Date();
    expiry.setDate(expiry.getDate());
    return jwt.sign({
            email: this.email,
            role: this.role,
            username: this.username,
            exp: parseInt((expiry.getTime() / 1000) + 3600)// 1 час на токен
        },
        process.env.JWT_SECRET
    );
};

mongoose.model('User', usersSchema, 'users');