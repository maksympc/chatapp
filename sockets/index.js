var logger = require('../logger');
var usersService = require('./services/users');
var messagesService = require('./services/messages');
var socketioJwt = require('socketio-jwt');

var index = {};
//store all users emails with socket objects
var usersOnlineStorage = new Map();
//store all emails with Date object, used to control time between
var usersTimer = new Map();

// заполнять только ник-неймами пользователей
function getOnlineUsers(usersMap) {
    var users = [];
    //create array of user's objects, that contains email, username, role;
    usersMap.forEach((value, key) => {
        users.push(value.user);
    });
    return users;
}

function updateLastMessageTimeById(id) {
    usersTimer.set(id, Date.now());
}

function checkLastMessageTimeById(id) {
    if (usersTimer.get(id)) {
        let difference = Date.now() - usersTimer.get(id);
        // difference should be greater than 15 seconds
        if (difference < 15 * 1000)
            return {status: false, wait: ((15 * 1000 - difference) / 1000).toFixed(2)};
        else
            return {status: true};
    }
    else {
        return {status: true};
    }
}

index.init = function (server) {
    let io = require('socket.io')(server);

    io.on('connection', socketioJwt.authorize({
        secret: process.env.JWT_SECRET,
        timeout: 15000 // 15 seconds to send the authentication message
    }))
        .on('authenticated', (socket) => {
                logger.debug('AuthToken: ' + JSON.stringify(socket.decoded_token));

                if (!usersOnlineStorage.get(socket.id)) {
                    // we store the user in the socket session for this client
                    socket.user = {
                        username: socket.decoded_token.username,
                        email: socket.decoded_token.email,
                        role: socket.decoded_token.role,
                    };
                    usersOnlineStorage.set(socket.id, socket);
                    logger.debug('Socket user is absent in onlineUsers: #add user:' + JSON.stringify(socket.user));


                    // оповещаем всех, кто админ, новым спииском онлайн-пользователей
                    for (let sock of usersOnlineStorage.values()) {
                        if (sock.user.role.toLowerCase() === 'admin') {
                            sock.emit('get all users', {
                                allUsers: usersService.getAllUsers()
                            });
                        }
                    }

                    socket.emit('login', {
                        numUsers: usersOnlineStorage.size,
                        messages: messagesService.getAllMessages(),
                        onlineUsers: getOnlineUsers(usersOnlineStorage)
                    });

                    // echo globally (all clients) that a person has connected
                    socket.broadcast.emit('user joined', {
                        numUsers: usersOnlineStorage.size,
                        username: socket.user.username,
                        onlineUsers: getOnlineUsers(usersOnlineStorage)
                    });
                }

                // when the user disconnects.. perform this
                // 0. На фронте инициируется событие разрыва связи
                // 1. Если пользователь присутствует в хранилище пользователей, удаляем его по ключу
                // 2. Отправляем остальным сокетам, имя отключившегося пользователя, новое количество и список online-участников. Выход
                socket.on('disconnect', () => {
                    logger.debug('Socket #disconnect:', socket.user.email);
                    // удаляем пользователя из хранилища
                    if (usersOnlineStorage.get(socket.id)) {
                        usersOnlineStorage.delete(socket.id);
                        // echo globally that this client has left
                        socket.broadcast.emit('user left', {
                            numUsers: usersOnlineStorage.size,
                            username: socket.user.username,
                            onlineUsers: getOnlineUsers(usersOnlineStorage)
                        });
                    }
                });


                // when the client emits 'new message', this listens and executes
                // 0. На фронте инициируется событие нового сообщения
                // 1. Лезем в базу, вытаскиваем пользователя по email
                // 2. Проверяем статус пользователя. Пользователь имеет ограничения (ban, mute)
                // 2.1 Если пользователь забанен, обрываем с ним связь. Выход
                // 2.2 Если пользователь на mute, сообщяем текущий сокет, что сообщение не может быть добавлено, так как он находится на mute. Выход
                // 3. Пользователь "чистый"
                // 3.1 Проверяем время последней отправки сообщения на сервер, если меньше 15 сек, оповещаем текущий сокет, что невозомжно добавить. Подождите N-секунд. Выход
                // 3.2 Если прошла проверка тайм-аутом, сохраняем сообщение в базе.
                // 3.3 Отправляем остальным сокетам имя пользователя, время, текст. Выход
                // на входе объект вида:
                // {
                // email:e@mail.com,
                // message:text message
                // }
                socket.on('new message', (messageItem) => {
                    logger.debug('Socket try to add #new message:', messageItem);
                    usersService
                        .checkBanUser(messageItem.email)
                        .then(banCheck => {
                                logger.debug('Check ban status:', messageItem.email);
                                // был ли забанен
                                if (banCheck.status) {
                                    if (banCheck.ban) {
                                        logger.debug('User was banned:', messageItem.email);
                                        socket.disconnect(true);
                                    } else {


                                        // был ли замучен
                                        usersService
                                            .checkMuteUser(messageItem.email)
                                            .then(
                                                muteCheck => {
                                                    if (muteCheck.status) {
                                                        if (muteCheck.mute) {
                                                            logger.debug('User was muted:', messageItem.email);
                                                            socket.emit('info', {message: "Can't add message, cause: you are muted!"});
                                                        } else {

                                                            // время крайнего коммента
                                                            let lastMessageTime = checkLastMessageTimeById(socket.id);
                                                            if (!lastMessageTime.status) {
                                                                logger.debug('Timeout error. Need to wait:', messageItem.email + ", " + lastMessageTime.wait + " sec");
                                                                socket.emit('info', {message: "Can't add message, you should wait for " + lastMessageTime.wait + " sec!"});
                                                                return;
                                                            }

                                                            // добавляем в базу
                                                            messagesService
                                                                .addMessage(messageItem)
                                                                .then(messageRes => {
                                                                    if (messageRes.status) {
                                                                        updateLastMessageTimeById(socket.id);
                                                                        socket.emit('info', {message: 'new message added!'});
                                                                        socket.broadcast.emit('new message', {
                                                                            username: socket.user.username,
                                                                            message: messageRes.message.message,
                                                                            createdOn: messageRes.message.createdOn
                                                                        });
                                                                    } else {
                                                                        logger.debug('Can\'t add message:', messageRes.message);
                                                                        socket.emit('info', {message: 'Can\'t add message, cause:' + messageRes.message});
                                                                    }
                                                                });
                                                        }
                                                    } else {
                                                        socket.emit('info', {message: 'Can\'t add message, cause:' + muteCheck.message});
                                                    }
                                                }
                                            );
                                    }
                                } else {
                                    socket.emit('info', {message: 'Can\'t add message, cause:' + banCheck.message});
                                }
                            }
                        );
                });


                // when the client emits 'typing', we broadcast it to others
                // Реализаия без проверок, дорого ходить в базу на каждое нажатие пользователя
                // 0. На фронте инициируется событие "печатает"
                // 1. Идем в базу, достаем пользователя и проверяем статус
                // 1.1 Если забанен или стоит на mute, игнорируем
                // 2. Отсылаем остальным пользователям, имя участника, который печатает
                socket.on('typing', () => {
                    socket.broadcast.emit('typing', {
                        username: socket.user
                    });
                });

                // when the client emits 'stop typing', we broadcast it to others
                // 0. На фронте инициируется событие "перестал печатать"
                // 1. Отправляем событие остальным, что пользователь перестал печатать
                socket.on('stop typing', () => {
                    socket.broadcast.emit('stop typing', {
                        username: socket.user
                    });
                });

                // 0. На фронте инициируется событие бан пользователя
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Бан пользователя, обновляем статус в базе.
                // 3. Разрыв соединения с пользователем, который имеет такой email.
                // 4. Отправляем другим пользователям, что пользователь был забанен. Выход
                socket.on('ban user', (email) => {
                    logger.debug('Socket #ban user:', email);
                    // проверяем роль пользователя
                    if (socket.user.role.toLowerCase() !== 'admin') {
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }
                    // не можем банить сами себя
                    if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                        socket.emit('info', {message: 'You can\'t ban yourself!'});
                        return;
                    }
                    // баним в базе по переданному email
                    usersService
                        .banUser(email)
                        .then(banRes => {
                                if (banRes.status) {
                                    // смотрим все сокет-соединения с данным email и отрубаем
                                    for (let sock of usersOnlineStorage.value()) {
                                        if (sock.user.email === email) {
                                            let username = sock.user.username;
                                            sock.disconnect(true);
                                            socket.broadcast.emit('banned', {username: username});
                                        }
                                    }
                                } else {
                                    socket.emit('info', {message: 'Can\'t ban user, cause:' + banRes.message});
                                }
                            }
                        );
                });

                // 0. На фронте инициируется событие разбан пользователя
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Разбан пользователя, обновляем статус в базе.
                // 3. Отправляем другим пользователям, что пользователь был разбанен. Выход
                socket.on('unban user', (email) => {
                    logger.debug("=====#MAIN:(unban user), try to unban:" + email);
                    // проверка на админа
                    if (socket.user.role.toLowerCase() !== 'admin') {
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }
                    // проверка на самого себя
                    if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                        socket.emit('info', {message: 'You can\'t unban yourself!'});
                        return;
                    }
                    // разбан пользователя
                    usersService
                        .unbanUser(email)
                        .then((res) => {
                            if (res.status) {
                                socket.emit('info', {message: 'User email:' + res.user.email + ' was successfully unbanned!'});
                                socket.broadcast.emit('unbanned', {data: res.user.username});
                            } else {
                                socket.emit('info', {message: 'Can\'t unban user, cause:' + res.message});
                            }
                        });
                });

                // 0. На фронте инициируется событие mute пользователя
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Mute пользователя, обновляем статус в базе.
                // 3. Отправляем пользователю, который имеет такой имел, что он был mute
                // 4. Отправляем другим пользователям, что пользователь был mute. Выход
                socket.on('mute user', (email) => {
                    logger.debug('Socket #mute user:', email);

                    if (socket.user.role.toLowerCase() !== 'admin') {
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }

                    if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                        socket.emit('info', {message: 'You can\'t mute yourself!'});
                        return;
                    }
                    usersService
                        .muteUser(email)
                        .then(muteRes => {
                            if (muteRes.status) {
                                // оповещаем пользователя, что он был замУчен
                                for (let sock of usersOnlineStorage.value()) {
                                    if (sock.user.email === email) {
                                        sock.emit('mute user');
                                        socket.broadcast.emit('muted', {username: muteRes.user.username})
                                    }
                                }
                                socket.emit('info', {message: 'User was successfully muted! Email:' + muteRes.user.email});
                            } else {
                                socket.emit('info', {message: 'Can\'t mute user, cause:' + muteRes.message});
                            }
                        });

                });

                // 0. На фронте инициируется событие unmute пользователя
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Unmute пользователя, обновляем статус в базе.
                // 3. Отправляем пользователю, который имеет такой имел, что он был unmute
                // 3. Отправляем другим пользователям, что пользователь был unmute. Выход
                socket.on('unmute user', (email) => {
                    logger.debug('Socket #unmute user:', email);

                    if (socket.user.role.toLowerCase() !== 'admin') {
                        logger.debug('Permission denied, your haven\'t admin rights!');
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }

                    if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                        logger.debug('You can\'t unmute yourself!');
                        socket.emit('info', {message: 'You can\'t unmute yourself!'});
                        return;
                    }

                    usersService
                        .unmuteUser(email)
                        .then(unmuteRes => {
                            if (unmuteRes.status) {
                                for (let sock of usersOnlineStorage.value()) {
                                    if (sock.user.email === email) {
                                        sock.emit('unmute user');
                                        socket.broadcast.emit('unmuted', {username: unmuteRes.user.username})
                                    }
                                }
                                socket.emit('info', {message: "User was successfully unmuted! Email:" + unmuteRes.user.email});
                            } else {
                                socket.emit('info', {message: 'Can\'t unmute user, cause:' + unmuteRes.message});
                            }
                        });
                });

                // 0. На фронте инициируется событие get users
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Вытаскиваем из базы всех зарегистрированных пользователей.
                // 3. Отправляем текущему сокету, список всех зарегистрированных пользователей. Выход
                socket.on('get all users', () => {
                    logger.debug('Socket #get users:');
                    if (socket.user.role.toLowerCase() !== 'admin') {
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }
                    usersService
                        .getAllUsers()
                        .then(getAllRes => {
                            if (getAllRes.status) {
                                socket.emit('get all users', {users: getAllRes.users});
                            } else {
                                socket.emit('info', {message: 'Can\'t get all users, cause:' + getAllRes.message});
                            }
                        });
                });

                // 0. На фронте инициируется событие remove messages
                // 1. Проверяем статус пользователя, который отправил это событие.
                // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
                // 2. Удаляются все сообщения в базе
                // 3. Отправляем остальным сокетам, что история сообщений была удалена.
                socket.on('remove messages', () => {
                    logger.debug('Socket #remove messages:');
                    if (socket.user.role.toLowerCase() !== 'admin') {
                        socket.emit('info', {message: 'Permission denied, your haven\'t admin rights!'});
                        return;
                    }

                    messagesService.removeAll().then(removeAllRes => {
                        if (removeAllRes.status) {
                            socket.broadcast.emit('remove messages', {username: socket.user.username});
                        } else {
                            socket.emit('info', {message: 'Can\'t remove all messages!, cause:' + removeAllRes.message});
                        }
                    });
                });
            }
        );
};
module.exports = index;