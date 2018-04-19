let logger = require('../../logger');
let mongoose = require('mongoose');
let User = mongoose.model('User');

module.exports.getAllUsers = function () {
    return User
        .find()
        .exec()
        .then(function (users) {
            if (users) {
                return {status: true, users: users};
            } else {
                return {status: false, message: "Users wasn't found!"}
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.banUser = function (email) {
    return User
        .findOneAndUpdate({'email': email}, {$set: {ban: true}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                return {status: true, user: user};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.unbanUser = function (email) {
    return User
        .findOneAndUpdate({'email': email}, {$set: {ban: false}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                return {status: true, user: user};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.checkBanUser = function (email) {
    return User
        .findOne({'email': email}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                logger.debug("banned!");
                return {status: true, ban: user.ban};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.muteUser = function (email) {
    return User
        .findOneAndUpdate({'email': email}, {$set: {mute: true}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                return {status: true, user: user};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.unmuteUser = function (email) {
    return User
        .findOneAndUpdate({'email': email}, {$set: {mute: false}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                return {status: true, user: user};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};

module.exports.checkMuteUser = function (email) {
    return User
        .findOne({'email': email}, {
            new: true,
            fields: 'role mute ban username email -_id'
        })
        .exec()
        .then(function (user) {
            if (user) {
                return {status: true, mute: user.mute};
            } else {
                return {status: false, message: 'User with email was not found!'};
            }
        })
        .catch(function (error) {
            return {status: false, message: error};
        });
};