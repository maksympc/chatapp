var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

// TODO: задаем стратегию аутентификации
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
                // пользователь найден, но пароль пользователя не верен
                if (!user.validPassword(password)) {
                    return done(null, false, {message: 'Incorrect password for user, with email:' + usernameField});
                }
                // если пароль верен, продолжаем
                // если было изменение имени, заменить имя пользователя в базе

                return done(null, user);
            });
    })
);