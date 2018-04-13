var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

// TODO: задаем стратегию аутентификации
passport.use(new LocalStrategy({
        usernameField: 'email'
    },
    function (username, password, done) {
        // ищем юзера в базе по емайлу
        User.findOne({email: username},
            function (err, user) {
                // возникла ошибка при поиске пользователя
                if (err) {
                    return done(err);
                }
                // пользователь не был найден
                if (!user) {
                    return done(null, false, {message: 'Can\'t find user with such email:' + username});
                }
                // пользователь найден, но пароль пользователя не верен
                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Incorrect password for user, with email:' + username});
                }
                // если пароль верен, возвращаем пользователя
                return done(null, user);
            });
    })
);