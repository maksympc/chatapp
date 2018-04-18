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

    io.use(socketioJwt.authorize({
        secret: process.env.JWT_SECRET,
        handshake: true
    }));

    io.on('connection', (socket) => {
        // залогировать пользователя
        logger.debug('Token: ' + socket.decoded_token);
        logger.debug('Get all users:' + usersService.getAllUsers());
        socket.emit('test', {
            data: usersService.getAllUsers()
        });

        // 0. После POST-запроса на быструю регистрацию/авторизацию создается/обновляется запись в БД, формируется и возвращается jwt-token.
        // 1. На фронте выбрасываем событие 'add user', необходимое для оповещения остальных пользователей, что появился новый участник
        // 1.1. Проверяем, не был ли пользователь ранее добавлен в список online-участников, если true, игнорируем событие. Выход
        // 2. Отправляем исходному сокету событие, в котором содержится история переписки, количество и список участников, которые онлайн.
        // 2.1. Проверяем роль пользователя, если админ, дополнительно делаем emit-сообщения, со всеми юзерами, присутствующими в базе.
        // 3. Отправляем остальным сокетам, имя нового пользователя, количество и список участников, которые онлайн. Выход
        socket.on('add user', (user) => {
            logger.debug('Socket #add user:', user);
            // если клиент отсутствсует, добавляем его real-time хранилище
            if (!usersOnlineStorage.get(socket.id)) {
                // we store the user in the socket session for this client
                socket.user = user;
                usersOnlineStorage.set(socket.id, socket);

                socket.emit('login', {
                    numUsers: usersOnlineStorage.size,
                    messages: '',
                    onlineUsers: getOnlineUsers(usersOnlineStorage)
                });
                // echo globally (all clients) that a person has connected
                socket.broadcast.emit('user joined', {
                    numUsers: usersOnlineStorage.size,
                    username: socket.user,
                    onlineUsers: getOnlineUsers(usersOnlineStorage)
                });
            }
        });

        // 0. После POST-запроса на быструю регистрацию/авторизацию создается/обновляется запись в БД, формируется и возвращается jwt-token.
        // 1. Проверяем, не был ли пользователь ранее добавлен в список online-участников, если true, игнорируем событие. Выход
        // 2. Отправляем исходному сокету событие, в котором содержится история переписки, количество и список участников, которые онлайн.
        // 2.1. Всем админам дополнительно делаем emit-сообщения, со всеми юзерами, присутствующими в базе.
        // 3. Отправляем остальным сокетам, имя нового пользователя, количество и список участников, которые онлайн. Выход
        // Принимаем на вход пользователя, объект вида:
        // {
        //      email:e@mail.com,
        //      username:username,
        //      role:admin
        // }
        socket.on('add usernew', (user) => {
            logger.debug('Socket try to #add user:', user.email);
            // если клиент отсутствсует, добавляем его real-time хранилище
            if (!usersOnlineStorage.get(socket.id)) {
                logger.debug('Socket user is absent in onlineUsers: #add user:', user.email);
                // we store the user in the socket session for this client
                socket.user = user;
                usersOnlineStorage.set(socket.id, socket);

                socket.emit('login', {
                    numUsers: usersOnlineStorage.size,
                    messages: messagesService.getAllMessages(),
                    onlineUsers: getOnlineUsers(usersOnlineStorage)
                });
                // оповещаем всех, кто админ, новым спииском онлайн-пользователей
                for (let sock of usersOnlineStorage.values()) {
                    if (sock.user.role.toLowerCase() === 'admin') {
                        sock.emit('get all users', {
                            allUsers: usersService.getAllUsers()
                        });
                    }
                }
                socket.broadcast.emit('user joined', {
                    numUsers: usersOnlineStorage.size,
                    username: socket.user.username,
                    onlineUsers: getOnlineUsers(usersOnlineStorage)
                });
            }
        });

        // when the user disconnects.. perform this
        // 0. На фронте инициируется событие разрыва связи
        // 1. Если пользователь присутствует в хранилище пользователей, удаляем его по ключу
        // 2. Отправляем остальным сокетам, имя отключившегося пользователя, новое количество и список online-участников. Выход
        socket.on('disconnect', () => {
            logger.debug('Socket #disconnect:', socket.user);
            // удаляем пользователя из хранилища
            if (usersOnlineStorage.get(socket.id)) {
                usersOnlineStorage.delete(socket.id);
                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    numUsers: usersOnlineStorage.size,
                    username: socket.user,
                    onlineUsers: getOnlineUsers(usersOnlineStorage)
                });
            }
        });

        // when the user disconnects.. perform this
        // 0. На фронте инициируется событие разрыва связи
        // 1. Если пользователь присутствует в хранилище пользователей, удаляем его по ключу
        // 2. Отправляем остальным сокетам, имя отключившегося пользователя, новое количество и список online-участников. Выход
        socket.on('disconnectnew', () => {
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
        socket.on('new message', (data) => {
            logger.debug('Socket #new message:', data);
            // we tell the client to execute 'new message'
            socket.broadcast.emit('new message', {
                username: socket.user,
                message: data
            });
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
        socket.on('new messagenew', (messageItem) => {
            logger.debug('Socket try to add #new message:', messageItem);
            let muteUserRes = usersService.checkMuteUser(messageItem.email);
            let banUserRes = usersService.checkBanUser(messageItem.email);
            // произошла ошибка при проверке mute-статуса пользователя
            if (!muteUserRes.status) {
                socket.emit('error', {error: muteUserRes.message});
                return;
            }
            // произошла ошибка при проверке ban-статуса пользователя
            if (!banUserRes.status) {
                // should check presence in onlineUsers
                socket.emit('error', {error: banUserRes.message});
                return;
            }
            // пользователь оказался забанен
            if (banUserRes.ban) {
                socket.disconnect(true);
                return;
            }
            // пользователь оказался на mute
            if (muteUserRes.mute) {
                socket.emit('info', {info: "Can't add message, as you was muted!"});
                return;
            }
            // проверяем время последнего отправленного сообщения
            let lastMessageTime = checkLastMessageTimeById(socket.id);
            if (!lastMessageTime.status) {
                socket.emit('info', {info: "Can't add message, you should wait for " + lastMessageTime.wait + " sec!"});
                return;
            }
            // сохраняем сообщение в базу
            let messageRes = messagesService.addMessage(messageItem);
            // обрабатываем результат сохрание
            // произошла ошибка при сохранении
            if (!messageRes.status) {
                socket.emit('error', {error: messageRes.message});
                return;
            }
            updateLastMessageTimeById(socket.id);
            socket.broadcast.emit('new message', {
                username: socket.user.username,
                message: messageRes.messageItem.message,
                createdOn: messageRes.messageItem.createdOn
            });
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
            logger.debug('Socket #ban user:', socket.user);
            socket.emit('ban user');
            socket.broadcast.emit('banned', {username: socket.user})
        });

        // 0. На фронте инициируется событие бан пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Бан пользователя, обновляем статус в базе.
        // 3. Разрыв соединения с пользователем, который имеет такой email.
        // 4. Отправляем другим пользователям, что пользователь был забанен. Выход
        socket.on('ban usernew', (email) => {
            logger.debug('Socket #ban user:', socket.user);
            // проверяем роль пользователя
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }
            // не можем банить сами себя
            if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                socket.emit('info', {info: 'You can\'t ban yourself!'});
                return;
            }
            // баним в базе по переданному email
            let banUserRes = usersService.banUser(email);
            // не удалось забанить
            if (!banUserRes.status) {
                socket.emit('info', {info: banUserRes.message});
                return;
            }
            // разрываем соединение с пользователем
            // необходима проверка на оповещение других пользователей и проверка списка пользователей, которые онлайн
            for (let sock of usersOnlineStorage.value()) {
                if (sock.user.email === email) {
                    let username = sock.user.username;
                    sock.disconnect(true);
                    socket.broadcast.emit('banned', {username: username});
                }
            }
        });

        // 0. На фронте инициируется событие разбан пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Разбан пользователя, обновляем статус в базе.
        // 3. Отправляем другим пользователям, что пользователь был разбанен. Выход
        socket.on('unban user', (email) => {
            logger.debug('Socket #unban user:', socket.user);
            socket.emit('unban user', {username: socket.user});
            socket.broadcast.emit('unbanned', {username: socket.user})
        });

        // 0. На фронте инициируется событие разбан пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Разбан пользователя, обновляем статус в базе.
        // 3. Отправляем другим пользователям, что пользователь был разбанен. Выход
        socket.on('unban usernew', (email) => {
            logger.debug('Socket #unban user:', email);
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }
            // не можем разбанить сами себя
            if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                socket.emit('info', {info: 'You can\'t unban yourself!'});
                return;
            }
            // разбаним в базе по переданному email
            let unbanUserRes = usersService.unbanUser(email);
            if (!unbanUserRes.status) {
                socket.emit('info', {info: unbanUserRes.message});
                return;
            }
            // отправляем сообщение, что пользователь был разбанен
            socket.emit('info', {info: "User was successfully unbanned! Email:" + unbanUserRes.user.email});
            socket.broadcast.emit('unbanned', {username: unbanUserRes.user.username});
        });


        // 0. На фронте инициируется событие mute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Mute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был mute
        // 3. Отправляем другим пользователям, что пользователь был mute. Выход
        socket.on('mute user', (email) => {
            logger.debug('Socket #mute user:', socket.user);
            socket.emit('mute user', {username: socket.user});
            socket.broadcast.emit('muted', {username: socket.user})
        });

        // 0. На фронте инициируется событие mute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Mute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был mute
        // 4. Отправляем другим пользователям, что пользователь был mute. Выход
        socket.on('mute usernew', (email) => {
            logger.debug('Socket #mute user:', email);
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }
            // не можем мУтить сами себя
            if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                socket.emit('info', {info: 'You can\'t mute yourself!'});
                return;
            }
            // мУтим в базе по переданному email
            let muteUserRes = usersService.muteUser(email);
            if (!muteUserRes.status) {
                socket.emit('info', {info: muteUserRes.message});
                return;
            }
            // оповещаем пользователя, что он был замУчен
            for (let sock of usersOnlineStorage.value()) {
                if (sock.user.email === email) {
                    sock.emit('mute user');
                    socket.broadcast.emit('muted', {username: muteUserRes.user.username})
                }
            }
            socket.emit('info', {info: 'User was successfully muted! Email:' + muteUserRes.user.email});
        });

        // 0. На фронте инициируется событие unmute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Unmute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был unmute
        // 3. Отправляем другим пользователям, что пользователь был unmute. Выход
        socket.on('unmute user', (email) => {
            logger.debug('Socket #unmute user:', socket.user);
            socket.broadcast.emit('unmute user', {username: socket.user});
            socket.broadcast.emit('unmuted', {username: socket.user})
        });

        // 0. На фронте инициируется событие unmute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Unmute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был unmute
        // 3. Отправляем другим пользователям, что пользователь был unmute. Выход
        socket.on('unmute usernew', (email) => {
            logger.debug('Socket #unmute user:', socket.user);
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }
            // не можем размУтить сами себя
            if (socket.user.email.toLowerCase() === email.toLowerCase()) {
                socket.emit('info', {info: 'You can\'t unmute yourself!'});
                return;
            }
            // размУтим в базе по переданному email
            let unmuteUserRes = usersService.unmuteUser(email);
            if (!muteUserRes.status) {
                socket.emit('info', {info: unmuteUserRes.message});
                return;
            }
            // оповещаем пользователя, что он был размУчен
            for (let sock of usersOnlineStorage.value()) {
                if (sock.user.email === email) {
                    sock.emit('unmute user');
                    socket.broadcast.emit('unmuted', {username: unmuteUserRes.user.username})
                }
            }
            socket.emit('info', {info: "User was successfully unmuted! Email:" + unmuteUserRes.user.email});
        });

        // 0. На фронте инициируется событие get users
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Вытаскиваем из базы всех зарегистрированных пользователей.
        // 3. Отправляем текущему сокету, список всех зарегистрированных пользователей. Выход
        socket.on('get all users', () => {
            logger.debug('Socket #get users:');
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }
            let getAllUsersRes = usersService.getAllUsers();
            if (!getAllUsersRes.status) {
                socket.emit('info', {info: getAllUsersRes.message});
                return;
            }
            socket.emit('get all users', {users: getAllUsersRes.users});
        });

        // 0. На фронте инициируется событие remove messages
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Удаляются все сообщения в базе
        // 3. Отправляем остальным сокетам, что история сообщений была удалена.
        socket.on('remove messages', () => {
            logger.debug('Socket #remove messages:');
            if (socket.user.role.toLowerCase() !== 'admin') {
                socket.emit('info', 'Permission denied, your haven\'t admin rights!');
                return;
            }

            let removeAllRes = messagesService.removeAll();
            if (!removeAllRes.status) {
                socket.emit('info', 'Can\'t remove all messages!');
                return;
            }
            socket.broadcast.emit('remove messages', {username: socket.user.username});
        });
    });
};

module.exports = index;