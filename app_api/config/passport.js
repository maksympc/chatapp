//
// This module describe the user login strategy
//
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
        usernameField: 'email'
    },
    function (usernameField, password, done) {
        // Try to find user by usernameField, that represents email address
        User.findOne({email: usernameField},
            function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    // Can't find user
                    return done(null, false, {message: 'Can\'t find user with such email:' + usernameField});
                }
                // If user banned, should restrict further login
                if (user.ban === true) {
                    return done(null, false, {message: 'User with email:' + usernameField + " was banned! Try to ask admin to unban!"});
                }
                // Check user password
                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Incorrect password for user, with email:' + usernameField});
                }
                // Success
                return done(null, user);
            });
    })
);