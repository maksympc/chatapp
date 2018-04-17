//broadcast EMIT
//1. user joined
//2. user left
//3. new message
//4. typing
//5. stop typing
//6. banned
//7. unbanned
//8. muted
//9. unmuted

//direct EMIT
//1. login
//2. ban user
//3. unban user
//4. mute user
//5. unmute user
//6. get users

//socket ON
//1. add user
//2. disconnect
//3. new message
//4. typing
//5. stop typing
//6. ban user
//7. unban user
//8. mute user
//9. unmute user
//10. get users

var logger = require('../logger');
//var socketioJwt = require('socketio-jwt');
var index = {};
//store all socket_id with client_jwt_token
var onlineUsers = new Map();

// заполнять только ник-неймами пользователей
function getOnlineUsernames(usersMap) {
    var users = [];
    usersMap.forEach((value, key) => {
        users.push(value.user);
    });
    return users;
}

index.init = function (server) {
    var io = require('socket.io')(server);


    // проверка, что пользователь авторизован и следует обрабатывать ивенты, которые он выбрасывает
    // io.set('authorization', socketioJwt.authorize({
    //     secret: jwtSecret,
    //     handshake: true
    // }));

    io.on('connection', (socket) => {
        // 0. После POST-запроса на быструю регистрацию/авторизацию создается/обновляется запись в БД, формируется и возвращается jwt-token.
        // 1. На фронте выбрасываем событие 'add user', необходимое для оповещения остальных пользователей, что появился новый участник
        // 1.1. Проверяем, не был ли пользователь ранее добавлен в список online-участников, если true, игнорируем событие. Выход
        // 2. Отправляем исходному сокету событие, в котором содержится история переписки, количество и список участников, которые онлайн.
        // 2.1. Проверяем роль пользователя, если админ, дополнительно делаем emit-сообщения, со всеми юзерами, присутствующими в базе.
        // 3. Отправляем остальным сокетам, имя нового пользователя, количество и список участников, которые онлайн. Выход
        socket.on('add user', (user) => {
            logger.debug('Socket #add user:', user);
            // если клиент отсутствсует, добавляем его real-time хранилище
            if (!onlineUsers.get(socket.id)) {
                // we store the user in the socket session for this client
                socket.user = user;
                onlineUsers.set(socket.id, socket);

                socket.emit('login', {
                    numUsers: onlineUsers.size,
                    messages: '',
                    onlineUsers: getOnlineUsernames(onlineUsers)
                });
                // echo globally (all clients) that a person has connected
                socket.broadcast.emit('user joined', {
                    numUsers: onlineUsers.size,
                    username: socket.user,
                    onlineUsers: getOnlineUsernames(onlineUsers)
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
            if (onlineUsers.get(socket.id)) {
                onlineUsers.delete(socket.id);
                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    numUsers: onlineUsers.size,
                    username: socket.user,
                    onlineUsers: getOnlineUsernames(onlineUsers)
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


        // when the client emits 'typing', we broadcast it to others
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


        //TODO: need to implement
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

        // TODO: need to implement
        // 0. На фронте инициируется событие разбан пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Разбан пользователя, обновляем статус в базе.
        // 3. Отправляем другим пользователям, что пользователь был разбанен. Выход
        socket.on('unban user', (email) => {
            logger.debug('Socket #unban user:', socket.username);
            socket.emit('unban user', {username: socket.username});
            socket.broadcast.emit('unbanned', {username: socket.username})
        });

        // TODO: need to implement
        // 0. На фронте инициируется событие mute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Mute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был mute
        // 3. Отправляем другим пользователям, что пользователь был mute. Выход
        socket.on('mute user', (email) => {
            logger.debug('Socket #mute user:', socket.username);
            socket.emit('mute user', {username: socket.username});
            socket.broadcast.emit('muted', {username: socket.username})
        });

        // TODO: need to implement
        // 0. На фронте инициируется событие unmute пользователя
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Unmute пользователя, обновляем статус в базе.
        // 3. Отправляем пользователю, который имеет такой имел, что он был unmute
        // 3. Отправляем другим пользователям, что пользователь был unmute. Выход
        socket.on('unmute user', (email) => {
            logger.debug('Socket #unmute user:', socket.username);
            socket.broadcast.emit('unmute user', {username: socket.username});
            socket.broadcast.emit('unmuted', {username: socket.username})
        });

        //TODO: need to implement
        // 0. На фронте инициируется событие get users
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Вытаскиваем из базы всех зарегистрированных пользователей.
        // 3. Отправляем текущему сокету, список всех зарегистрированных пользователей. Выход
        socket.on('get users', () => {
            logger.debug('Socket #get users:');
            socket.emit('get users');
        });

        //TODO:
        // 0. На фронте инициируется событие delete history
        // 1. Проверяем статус пользователя, который отправил это событие.
        // 1.1 Вытаскиваем пользователя из базы. Проверяем, является ли он админом. Если нет - Выход.
        // 2. Удаляются все сообщения в базе
        // 3. Отправляем остальным сокетам, что история сообщений была удалена.
        socket.on('delete history', () => {
            logger.degub('Socket #delete history:');
            //delete messages history logic,
            //send delete history event
            socket.broadcast.emit('delete history', '');
        })
    });
};

module.exports = index;