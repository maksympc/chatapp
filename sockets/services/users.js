var mongoose = require('mongoose');
var User = mongoose.model('User');

module.exports.getAllUsers = function () {
    User.find().exec(
        function (err, users) {
            if (err)
                return {"status": false, "message": err};
            else
                return {"status": true, "users": users};
        }
    );
};

module.exports.banUser = function (email) {
    if (email) {
        User.findOneAndUpdate({'email': email}, {$set: {ban: true}}, {new: true},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "user": user};
                }
            });
    } else {
        return {"status": false, "message": "Can't ban user. Cause: Not found, email is required!"}
    }
};

module.exports.unbanUser = function (email) {
    if (email) {
        User.findOneAndUpdate({'email': email}, {$set: {ban: false}}, {new: true},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "user": user};
                }
            });
    } else {
        return {"status": false, "message": "Can't unban user. Cause: Not found, email is required!"};
    }
};

module.exports.checkBanUser = function (email) {
    if (email) {
        User.findOne({'email': email},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "ban": user.ban};
                }
            });
    } else {
        return {"status": false, "message": "Can't check user ban status. Cause: Not found, email is required!"};
    }
};

module.exports.muteUser = function (email) {
    if (email) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {mute: true}}, {new: true},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "user": user};
                }
            });
    } else {
        return {"status": false, "message": "Can't mute user. Cause: Not found, email is required!"};
    }
};

module.exports.unmuteUser = function (email) {
    if (email) {
        User.findOneAndUpdate({'email': userEmail}, {$set: {mute: false}}, {new: true},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "user": user};
                }
            });
    } else {
        return {"status": false, "message": "Can't unmute user. Cause: Not found, email is required!"};
    }
};

module.exports.checkMuteUser = function (email) {
    if (email) {
        User.findOne({'email': email},
            function (err, user) {
                if (err) {
                    return {"status": false, "message": err};
                } else {
                    return {"status": true, "mute": user.mute};
                }
            });
    } else {
        return {"status": false, "message": "Can't check user mute status. Cause: Not found, email is required!"};
    }
};