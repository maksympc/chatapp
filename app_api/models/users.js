//
// This module describe User schema
//
var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

// This schema describe user item.
// Contains email, username, role, salt and hash, which are used to hide and check plain password, mute, ban statuses.
var usersSchema = new mongoose.Schema(
    {
        email: {type: String, required: true},
        username: {type: String, required: true},
        role: {type: String, required: true, default: 'user'},

        salt: {type: String, required: true},
        hash: {type: String, required: true},

        mute: {type: Boolean, required: true, default: false},
        ban: {type: Boolean, required: true, default: false},
    }
);

// This method is used to create cryptography strong password based on plain password, provided by user
// password - plain password value
usersSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
};

// This method is used to validate password.
// password - plain password value
usersSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
    return this.hash === hash;
};

// This method is user to generate jwt-token.
// Token should contain: email, role, username, mute and exp status.
// JWT_SECRET stores in env variable and should be provided in each project manually.
// As an example, you can create .env file in root application folder and add next string:JWT_SECRET = "This_is_secret"
usersSchema.methods.generateJwt = function () {
    var expiry = new Date();
    const EXPIRE_IN_SECONDS = 3600;
    return jwt.sign({
            email: this.email,
            role: this.role,
            username: this.username,
            mute: this.mute,
            exp: parseInt((expiry.getTime() / 1000) + EXPIRE_IN_SECONDS)
        },
        process.env.JWT_SECRET
    );
};

mongoose.model('User', usersSchema, 'users');