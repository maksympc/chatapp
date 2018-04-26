//
// This service is used to interact with User schema
//
let logger = require('../../logger');
let mongoose = require('mongoose');
let User = mongoose.model('User');


// Get all users from DB.
// Returns the object with following structure {status:boolean, message:String | users:object[] }.
module.exports.getAllUsers = async () => {
    try {
        let usersItem = await User.find({}, 'role mute ban username email -_id');
        if (usersItem)
            return {status: true, users: usersItem};
        else
            return {status: false, message: "Users wasn't found!"};
    } catch (error) {
        return {status: false, message: error};
    }
};


// Set ban user status in true.
// Returns the object with following structure {status:boolean, message:String | user:object }.
module.exports.banUser = async (email) => {
    try {
        let userItem = await User.findOneAndUpdate({'email': email}, {$set: {ban: true}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        });
        logger.debug('#banUser, userItem:' + JSON.stringify(userItem));
        if (userItem) {
            return {status: true, user: userItem};
        } else {
            return {status: false, message: 'User with email was not found!'};
        }
    } catch (error) {
        return {status: false, message: error};
    }
};


// Set ban user status in false.
// Returns the object with following structure {status:boolean, message:String | user:object }.
module.exports.unbanUser = async (email) => {
    try {
        let userItem = await User.findOneAndUpdate({'email': email}, {$set: {ban: false}}, {
            new: true,
            fields: 'role mute ban username email -_id'
        });
        if (userItem) {
            return {status: true, user: userItem};
        } else {
            return {status: false, message: 'User with email was not found!'};
        }
    } catch (error) {
        return {status: false, message: error};
    }
};


// Set ban user status.
// Returns the object with following structure {status:boolean, message:String | ban:boolean}.
module.exports.getBanUserStatus = async (email) => {
    try {
        let banStatus = await User.findOne({'email': email}, 'ban -_id');
        logger.debug('#getBanUserStatus, banStatus:' + JSON.stringify(banStatus));
        if (banStatus) {
            return {status: true, ban: banStatus.ban};
        } else {
            logger.debug("User with email was not found!");
            return {status: false, message: 'User with email was not found!'};
        }
    }
    catch (error) {
        return {status: false, message: error};
    }
};


// Set mute user status in true.
// Returns the object with following structure {status:boolean, message:String | user:object }.
module.exports.muteUser = async (email) => {
    try {
        let userItem = await User
            .findOneAndUpdate({'email': email}, {$set: {mute: true}}, {
                new: true,
                fields: 'role mute ban username email -_id'
            });
        if (userItem) {
            return {status: true, user: userItem};
        } else {
            return {status: false, message: 'User with email was not found!'};
        }
    } catch (error) {
        return {status: false, message: error};
    }
};


// Set mute user status in false.
// Returns the object with following structure {status:boolean, message:String | user:object }.
module.exports.unmuteUser = async (email) => {
    try {
        let userItem = await User
            .findOneAndUpdate({'email': email}, {$set: {mute: false}}, {
                new: true,
                fields: 'role mute ban username email -_id'
            });
        if (userItem) {
            return {status: true, user: userItem};
        } else {
            return {status: false, message: 'User with email was not found!'};
        }
    } catch (error) {
        return {status: false, message: error};
    }
};


// Get mute user status.
// Returns the object with following structure {status:boolean, message:String | mute:boolean }.
module.exports.getMuteUserStatus = async (email) => {
    try {
        let muteStatus = await User.findOne({'email': email}, 'mute -_id');
        if (muteStatus) {
            return {status: true, mute: muteStatus.mute};
        } else {
            logger.debug("User with email was not found!");
            return {status: false, message: 'User with email was not found!'};
        }
    }
    catch (error) {
        return {status: false, message: error};
    }
};