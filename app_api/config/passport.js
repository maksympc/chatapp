var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

// TODO: задаем стратегию аутентификации и входа пользователя
passport.use(new LocalStrategy({
        usernameField: 'email'
    },
    function (usernameField, password, done) {
        // ищем юзера в базе по емайлу
        User.findOne({email: usernameField},
            function (err, user) {
                // возникла ошибка при поиске пользователя
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, {message: 'Can\'t find user with such email:' + usernameField});
                }
                // если пользователь забанен, запретить вход
                if (user.ban === true) {
                    return done(null, false, {message: 'User with email:' + usernameField + " was banned! Try to ask admin to unban!"});
                }
                // пользователь найден, но пароль пользователя не верен
                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Incorrect password for user, with email:' + usernameField});
                }
                // если пароль верен и пользователь не забанен, продолжаем
                return done(null, user);
            });
    })
);