var logger = require('../../logger');
var passport = require('passport');
var mongoose = require('mongoose');
var User = mongoose.model('User');

var updateJsonResponse = function (res, status, data) {
    res.status(status);
    res.json(data);
};

// обработка входа пользователя, как результат, либо сообщение об ошибке, либо возвращаем токен
module.exports.login = function (req, res) {
    logger.debug('Authentication controller:#login with params:\n', req.body);
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;
    var token;

    // проверка на наличие параметров в запросе!
    if (!username || !email || !password) {
        updateJsonResponse(res, 400, {message: "Can't login user, all fields required!"});
        logger.debug("'Authentication controller: #login: not enough params");
        return;
    }

    // Поиск пользователя в базе по имейлу
    User.findOne({email: email}, function (err, user) {
        logger.debug("Try to find user while logging!");
        // Обрабатываем ошибки
        if (err) {
            updateJsonResponse(res, 400, err);
            logger.debug("Authentication controller: #login error:", err);
        }
        // если пользователь не был ранее найден, создаем нового пользователя
        if (!user) {
            logger.debug("Authentication controller: #login. User with email:", email, " was not found, create new user.");
            let user = new User();
            user.username = username;
            user.email = email;
            user.setPassword(password);
            user.save(function (err) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                    logger.debug("Authentication controller: #login. Can't create user with email:", email, ". Error was occurred:", err);
                } else {
                    token = user.generateJwt();
                    updateJsonResponse(res, 201, {token: token});
                    logger.debug("Authentication controller: #login. User with email:", email, ". was successfully created!");
                }
            });
        }
        // Если пользователь присутствует в базе, проверяем его с помощью passport аутентификации
        else {
            passport.authenticate('local', function (err, user, info) {
                if (err) {
                    logger.debug("error is occurred!", err);
                    updateJsonResponse(res, 404, err);
                    return;
                }
                if (user) {
                    // если у пользователя был изменен username, сохраняем изменения в базе данных
                    if (user.username !== username) {
                        user.username = username;
                        user.save(function (err) {
                            if (err) {
                                updateJsonResponse(res, 404, err);
                                logger.debug("Authentication controller: #login. Can't create user with email:", email, ". Error was occurred:", err);
                            }
                        });
                    }
                    // формируем и возвращаем token
                    token = user.generateJwt();
                    updateJsonResponse(res, 200, {token: token});
                    logger.debug("Authentication controller: #login. User with email:", email, " was successfully sign in!");
                } else {
                    updateJsonResponse(res, 404, info);
                    logger.debug("Authentication controller: #login. User with email:", email, " has invalid credentials!");
                }
            })(req, res);
        }
    });
};