var mongoose = require('mongoose');
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    role: String, // Role of current user (admin or user). Admin has additional capabilities
    status: String, // Status of current user (mute, ban, active). Managed by admin.
    hash: String, // Hash value, produced from salt and plain password
    salt: String // Salt, Random value, that should be added to plain password
});

/*Set password for user. Used to transform plain password to cryptographically strong value*/
userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 100, 64).toString('hex');
};

/*Validate password for user*/
userSchema.methods.validPassword = function (password) {
    var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64).toString('hex');
    return this.hash === hash;
};

/*Create inentifier for user, based on JWT approach*/
userSchema.methods.generateJwt = function () {
    var expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        exp: parseInt(expiry.getTime() / 1000)
    }, process.env.JWT_SECRET);
};