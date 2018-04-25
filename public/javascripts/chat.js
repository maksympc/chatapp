function parseJwt(token) {
    if ((typeof token !== 'undefined') && (typeof token !== 'null')) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    }
}

function dateToString(date) {
    let n = new Date(date);
    let y = n.getFullYear();
    let m = n.getMonth() + 1;
    let d = n.getDate();
    let hr = n.getHours();
    let hh = hr < 10 ? '0' + hr : hr;
    let min = n.getMinutes();
    let mm = min < 10 ? '0' + min : min;
    let sec = n.getSeconds();
    let ss = sec < 10 ? '0' + sec : sec;
    return d + "/" + m + "/" + y + " " + hh + ":" + mm + ":" + ss;
}

$(document).ready(function () {
    var FADE_TIME = 100; // ms
    var TYPING_TIMER_LENGTH = 500; // ms

    var COLORS = [
        //yellow
        '#ffcc5c',
        '#f2ae72',
        '#d9ad7c',
        '#d4ac6e',
        '#feb236',
        "#ffd11a",
        '#FF7F50',
        '#BDB76B',
        '#FFA500',
        // //red
        '#d64161',
        '#f7786b',
        '#f18973',
        '#FF7F50',
        '#FF1493',
        "#bf4080",
        '#e06377',
        '#800000',
        '#bc5a45',
        '#c83349',
        // //green
        '#588c7e',
        '#5b9aa0',
        '#006400',
        '#77a8a8',
        '#80ced6',
        '#3CB371',
        '#6B8E23',
        '#82b74b',
        //blue
        '#0099ff',
        '#9999ff',
        '#003399',
        "#2F4F4F",
        '#9900cc',
        '#66ccff',
        '#6600ff',
        '#00ccff',
        '#8A2BE2',

    ];

    const MESSAGE_SEND_MILLISECONDS_TIMEOUT = 3 * 1000;
    var lastTimeSend;

    var $window = $(window);
    // ссылка на список ul сообщений чата
    var $messages = $('#messages');
    // input message box
    var $inputMessage = $('#inputMessage');
    var $onlineUsersUl = $('#onlineUsersUl');
    var $allUsersUl = $('#allUsersUl');
    var $infoUl = $('#infoUl');
    // object, that contains all token's {email, role, username, exp, iat} fields
    var user = parseJwt(localStorage.token);
    // for typing socket event
    var typing = false;
    // to track users input
    var lastTypingTime;
    // фокусируемся на поле, при вводе сообщения
    var $currentInput = $inputMessage.focus();
    var $logoutBtn = $('#logoutId');
    var $profileBtn = $('#profileId');
    // dependency will placed in chat.html file
    var socket = io();

    // function createAdminModal(userItem){
    //     // let $root = $('<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">');
    //
    // }
    //
    // function bindProfileButton() {
    //     if (user) {
    //     }
    // }


    // $profileBtn.text(user.username);

    (function () {
        if (user.role != 'admin') {
            $('#allUsersId').remove();
        }
    }());

    // incoming value
    // TODO: переписать с использованием более сложного объекта сообщения
    function addParticipantsMessage(numUsers) {
        var message = '';
        if (numUsers === 1)
            message += "there's 1 participant online";
        else
            message += "there are " + numUsers + " participants online";
        log(message);
        log('______________________________________');
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).html();
    }

    // TODO: проверить методы
    function sendMessage() {
        var message = $inputMessage.val();
        message = cleanInput(message);
        if (message) {
            $inputMessage.val('');


            // TODO: перед добавлением сообщения сделать проверку на 15 секунд.
            socket.emit('new message', {email: user.email, username: user.username, message: message})
        }
    }

    // Log message
    // TODO: создание элемента для печати сообщения.
    function log(message, options) {
        var $el = $('<li>').text(message).css('text-align', 'center').css('color', '#669999');
        addMessageElement($el, options);
    }

    // создание сообщение-чата в списке сообщений
    // TODO: пересмотреть используемые методы
    function addChatMessage(data, options) {
        // проверяем, есть ли элемент, который отвечает за то,
        // печатает ли этот пользователь в этот момент
        var $typingMessages = getTypingMessages(data);
        options = options || {};

        // удаляем из списка сообщений
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }
        // создаем элемент списка сообщений
        let $messageDiv = $('<li class="d-flex"/>');
        // TODO: можно разбить на 2 функции
        if (data.createdOn) {

            // 1. аватар и имя
            let $avatarArea = $('<div class="d-flex flex-column align-items-center message-avatar"/>');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"/>').css('color', getUsernameColor(data.username));
            let $username = $('<div/>').text(data.username).css('color', getUsernameColor(data.username));
            $avatarArea.append($avatar, $username);
            // 2. тело сообщения и время
            let $messageArea = $('<div class="container-fluid d-flex flex-column"/>');
            let $message = $('<div>').text(data.message).css('color', getUsernameColor(data.username));
            let $time = $('<div class="mt-auto p-2 align-self-end message-time">').text(dateToString(data.createdOn));
            $messageArea.append($message, $time);
            // 3. заполняем элемент списка
            $messageDiv.addClass('message-container').append($avatarArea, $messageArea);
        } else {
            let typingClass = data.typing ? 'typing' : '';
            // 1. Имя
            let $username = $('<div/>').text(data.username).css('color', getUsernameColor(data.username));
            // 1. is typing...
            let $message = $('<div>').text(data.message).css('padding-left', '5px');
            // 3. заполняем элемент списка
            $messageDiv.data('username', data.username).addClass('message').addClass(typingClass).append($username, $message);
        }

        addMessageElement($messageDiv, options);
    }

    // Добавить визуальное отображение, что кто-то печатает
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing...';
        addChatMessage(data);
    }

    // Убрать визуальное отображение, что кто-то печатает...
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        })
    }

    function updateMessages(data) {
        $messages.empty();
        var options = {animationTime: 20};
        data.messages.forEach((message) => {
            addChatMessage(message, options);
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        var $el = $(el);
        //default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }

        options.animationTime = options.animationTime || 'slow';

        // прокрутка вниз
        $('#messagesDiv').animate({
            scrollTop: $messages[0].scrollHeight
        }, options.animationTime);
    }


    //render new users[] in #onlineUsersUl
    function updateOnlineUsersList(data) {
        // проходимся по каждому элементу в массиве
        $onlineUsersUl.empty();
        data.forEach((user, index, onlineUsers) => {
            // rootItem
            let $rootLi = $('<li class="list-inline-item text-center userLiItem"/>');
            //icon
            let $avatarArea = $('<div class="d-none d-md-block d-xl-block">');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"></i>').css('color', getUsernameColor(user.username));
            $avatarArea.append($avatar);
            //username
            let $onlineSuccess = $('<i class="fa fa-circle"></i>').css('color', '#66de28');
            let $name = $('<span/>').text(' ' + user.username).css('color', getUsernameColor(user.username));
            let $username = $('<div/>').append($onlineSuccess, $name);
            // buttons for admin
            // let $buttonGroup = $('<div class="btn-group"/>');
            // //ban
            // let $buttonBan = $('<button type="button" class="btn btn-danger btn-sm btn-admin-btn"/>')
            //     .data('email', user.email)
            //     .append('<i class="fa fa-remove managingIcon"/>');
            // //mute
            // let $buttonMute = $('<button type="button" class="btn btn-warning btn-sm btn-admin-btn"/>')
            //     .data('email', user.email)
            //     .append('<i class="fa fa-volume-off managingIcon"/>');
            // //unmute
            // let $buttonUnmute = $('<button type="button" class="btn btn-info btn-sm btn-admin-btn"/>')
            //     .data('email', user.email)
            //     .append('<i class="fa fa-volume-up managingIcon"/>');
            // //unban
            // let $buttonUnban = $('<button type="button" class="btn btn-success btn-sm btn-admin-btn"/>')
            //     .data('email', user.email)
            //     .append('<i class="fa fa-user-plus managingIcon"/>');
            // $buttonGroup.append($buttonBan, $buttonMute, $buttonUnmute, $buttonUnban);
            // construct root <li> element
            // $rootLi.append($avatarArea, $username, $buttonGroup);
            $rootLi.append($avatarArea, $username);
            // render root li element
            addOnlineUserElement($rootLi);
        });
    }

    function addOnlineUserElement(el) {

        $onlineUsersUl.append(el);
        $('#onlineUsersDiv').animate({
            scrollLeft: $onlineUsersUl[0].scrollWidth
        }, 'fast');
    }

    //render all users[] in #allUsersUl, should use for admin only!
    function updateAllUsersList(data) {
        // проходимся по каждому элементу в массиве
        $allUsersUl.empty();
        data.forEach((user, index, onlineUsers) => {
            // rootItem
            let $rootLi = $('<li class="list-inline-item text-center userLiItem"/>');
            //icon
            let $avatarArea = $('<div class="d-none d-md-block d-xl-block">');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"></i>').css('color', getUsernameColor(user.username));
            $avatarArea.append($avatar);
            //username
            let $username = $('<div/>').text(user.username).css('color', getUsernameColor(user.username));
            // buttons for admin
            let $buttonGroup = $('<div class="btn-group"/>');
            //ban
            let $buttonBan = $('<button type="button" class="btn btn-danger btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('ban user', $(this).data('email'));
                })
                .append('<i class="fa fa-remove managingIcon"/>');
            //mute
            let $buttonMute = $('<button type="button" class="btn btn-warning btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('mute user', $(this).data('email'));
                })
                .append('<i class="fa fa-volume-off managingIcon"/>');
            //unmute
            let $buttonUnmute = $('<button type="button" class="btn btn-info btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('unmute user', $(this).data('email'));
                })
                .append('<i class="fa fa-volume-up managingIcon"/>');
            //unban
            let $buttonUnban = $('<button type="button" class="btn btn-success btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('unban user', $(this).data('email'));
                })
                .append('<i class="fa fa-user-plus managingIcon"/>');
            $buttonGroup.append($buttonBan, $buttonMute, $buttonUnmute, $buttonUnban);
            // construct root <li> element
            $rootLi.append($avatarArea, $username, $buttonGroup);
            // render root li element
            addAllUserElement($rootLi);
        });
    }

    function addAllUserElement(el) {
        $allUsersUl.append(el);
        $('#allUsersDiv').animate({
            scrollLeft: $onlineUsersUl[0].scrollWidth
        }, 'fast');
    }


    function createInfoListItem(data) {
        let $li = $('<li/>').text(data);
        addInfoListItem($li);
    }

    function addInfoListItem(el) {
        $infoUl.append(el);
        $('#infoArea').animate({
            scrollTop: $infoUl[0].scrollHeight
        }, 'fast');
    }


    // Updates the typing event
    function updateTyping() {
        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();
        setTimeout(function () {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }

    // Gets the 'X is typing' messages of a user
    // перебирает все элементы с такими классами, ищет где совпадает имя и возвращает элемент
    function getTypingMessages(data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through our hash function
    function getUsernameColor(username) {
        // Compute hash code
        var hash = 7;
        for (var i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        return COLORS[index];
    }

    // Keyboard events

    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        // TODO: отправляем сообщение
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (user) {
                // делаем проверку на 15 секунд
                if (lastTimeSend) {
                    if (MESSAGE_SEND_MILLISECONDS_TIMEOUT > (Date.now() - lastTimeSend)) {
                        createInfoListItem("Before sending, you should wait " + ((MESSAGE_SEND_MILLISECONDS_TIMEOUT - (Date.now() - lastTimeSend)) / 1000).toFixed(2) + " sec");
                        return;
                    }
                }
                lastTimeSend = Date.now();
                sendMessage();
                socket.emit('stop typing');
                typing = false;

            }
        }
    });

    // оповещаем, что пользователь вводит сообщение
    $inputMessage.on('input', function () {
        updateTyping();
    });

    // Click events

    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    $logoutBtn.click(function () {
        localStorage.token = null;
        console.log('button was pressed!');
        if (socket) {
            console.log('socket present!');
            socket.disconnect(true);
            window.location.replace(window.location.href.slice(0, -4));
            return;
        }
        window.location.replace(window.location.href.slice(0, -4));
    });


    socket.on('connect', function () {
        socket.emit('authenticate', {token: localStorage.token})
            .on('authenticated', function (message) {

                // Whenever the server emits 'login', log the login message
                // {numUsers, messages[], onlineUsers[]}
                socket.on('login', function (data) {
                    user = data.user;
                    // should parse data object
                    updateOnlineUsersList(data.onlineUsers);
                    updateMessages(data.messages);
                    // Display the welcome message
                    log("Welcome, " + user.username);
                    addParticipantsMessage(data.numUsers);
                });

                // Whenever the server emits 'new message', update the chat body
                socket.on('new message', function (data) {
                    console.log('new message:' + JSON.stringify(data));
                    addChatMessage(data);
                });

                // Whenever the server emits 'user joined', log it in the chat body
                socket.on('user joined', function (data) {
                    console.log('user joined:' + JSON.stringify(data));
                    // update online users
                    updateOnlineUsersList(data.onlineUsers);
                    log(data.username + ' joined');
                    addParticipantsMessage(data.numUsers);
                });

                // Whenever the server emits 'user left', log it in the chat body
                socket.on('user left', function (data) {
                    log(data.username + ' left');
                    updateOnlineUsersList(data.onlineUsers);
                    addParticipantsMessage(data.numUsers);
                    removeChatTyping(data);
                });

                // Whenever the server emits 'typing', show the typing message
                socket.on('typing', function (data) {
                    console.log('typing:' + JSON.stringify(data));
                    addChatTyping(data);
                });

                // Whenever the server emits 'stop typing', kill the typing message
                socket.on('stop typing', function (data) {
                    console.log('stop typing:' + JSON.stringify(data));
                    removeChatTyping(data);
                });

                socket.on('get all users', function (data) {
                    updateAllUsersList(data);
                });

                socket.on('banned', function (data) {
                    createInfoListItem(data.message);
                });

                socket.on('unbanned', function (data) {
                    createInfoListItem(data.message);
                });

                socket.on('info', function (data) {
                    createInfoListItem(data.message);
                });

                socket.on('second connection', function (data) {
                    alert(data.message);
                });


                socket.on('mute user', function (data) {
                    createInfoListItem(data.message);
                    $inputMessage.prop("disabled", true);
                });

                socket.on('unmute user', function (data) {
                    console.log('unmute:' + JSON.stringify(data));
                    createInfoListItem(data.message);
                    $inputMessage.prop("disabled", false);
                });

                socket.on('muted', function (data) {
                    createInfoListItem(data.message);
                });

                socket.on('unmuted', function (data) {
                    createInfoListItem(data.message);
                });

                socket.on('remove all messages', function () {
                    console.log('remove all messages!');
                });

            })
            .on('disconnect', function () {
                // обрезаем ссылку до имени хоста
                localStorage.token = null;
                window.location.replace(window.location.href.slice(0, -4));
            })
            .on('reconnect', function () {
                alert('you have been reconnected');
            })
            .on('reconnect_error', function () {
                localStorage.token = null;
                alert('attempt to reconnect has failed');
            });
    });

});