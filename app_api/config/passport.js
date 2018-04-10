/* Register strategy, that will be used to check user credentials*/
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

passport.use(new LocalStrategy({
        usernameField: 'email' // Set, that as 'username' will be used 'email' field.
    }, function (username, password, done) {
        User.findOne({email: username}, function (err, user) {
            if (err) {
                return done(err);
            }
            if (!user) { // If user is absent, return false, and cause message
                return done(null, false, {
                    message: 'Incorrect username.'
                });
            }
            if (!user.validPassword(password)) { // check password, for found user.
                return done(null, false, {
                    message: 'Incorrect password.' // If password is incorrect, return false and cause message
                });
            }
            return done(null, user); // return found user
        });
    }
));