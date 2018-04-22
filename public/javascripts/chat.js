$(document).ready(function () {
    var FADE_TIME = 100; // ms
    var TYPING_TIMER_LENGTH = 500; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    // Initialize variables
    var $window = $(window);
    var $messages = $('.messages'); // Messages area
    var $inputMessage = $('.inputMessage'); // Input message input box

    // Prompt for setting a username
    // get username from token
    var user = {username: "aaaa", email: 'aaaa@admin.com', role: 'user'};
    var connected = true;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $inputMessage.focus();

    // Инициализация сокет-соединения при подключении
    var socket = io.connect('http://localhost:3000');

    $currentInput = $inputMessage.focus();

    socket.on('connect', function () {
        socket.emit('authenticate', {token: localStorage.token})
            .on('authenticated', function (message) {

                // если пользователь аутентифицировался, показываем страничку чата!
                //TODO: describe ON events
                socket.on('login', data => {
                    console.log('ON login:' + JSON.stringify(data));

                });
                socket.on('user joined', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + data;
                });
                socket.on('info', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + data;
                });
                socket.on('new message', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('banned', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('unbanned', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('mute user', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('muted', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('unmute user', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('unmuted', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('get all users', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('remove all messages', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + '\n' + data;
                });
                socket.on('get all messages', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = infoBlock.innerText + data;
                });
                socket.on('user left', data => {
                    console.log(JSON.stringify(data));
                    let infoBlock = $('#info');
                    infoBlock.innerText = data;
                });
                socket.on('disconnect', () => {
                    alert('You were disconnected!');
                    localStorage.token = null;
                    window.location.replace("http://localhost:3000/");
                });
                socket.on('second connection', (data) => {
                    alert('Message:' + data.message);
                    localStorage.token = null;
                    window.location.replace("http://localhost:3000/");
                });


                // TODO: ON-events C повторениями, пересмотреть!!!
                // Socket events
                // Whenever the server emits 'login', log the login message
                // Как только пользователь зашел, оповестить других участников!
                socket.on('login', function (data) {
                    console.log("ON old login:" + JSON.stringify(data));
                    connected = true;
                    addParticipantsMessage(data);
                });

                // Whenever the server emits 'new message', update the chat body
                socket.on('new message', function (data) {
                    addChatMessage(data);
                });

                // Whenever the server emits 'user joined', log it in the chat body
                socket.on('user joined', function (data) {
                    console.log(data);
                    log(data.username + ' joined');
                    addParticipantsMessage(data);
                });

                // Whenever the server emits 'user left', log it in the chat body
                socket.on('user left', function (data) {
                    console.log(JSON.stringify(data));
                    log(data.username + ' left');
                    addParticipantsMessage(data);
                    removeChatTyping(data);
                });

                // Whenever the server emits 'typing', show the typing message
                socket.on('typing', function (data) {
                    addChatTyping(data);
                });

                // Whenever the server emits 'stop typing', kill the typing message
                socket.on('stop typing', function (data) {
                    removeChatTyping(data);
                });

                socket.on('disconnect', function () {
                    log('you have been disconnected');
                });

                socket.on('reconnect', function () {
                    log('you have been reconnected');
                    if (user) {
                        socket.emit('add user', user);
                    }
                });

                socket.on('reconnect_error', function () {
                    log('attempt to reconnect has failed');
                });
            });
    });

    // обработка данных из login-ответа
    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant:" + JSON.stringify(data);
        } else {
            message += "there are " + data.numUsers + " participants. Data:" + JSON.stringify(data);
        }

        log(message);
    }

    // Sets the client's username
    // // TODO setUsername for user
    // function setUsername() {
    //     // Tell the server your username
    //     socket.emit('add user', username);
    // }

    // Sends a chat message
    function sendMessage() {
        var message = $inputMessage.val();
        // Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val('');
            // добавляем сообщение в чат
            addChatMessage({
                email: user.email,
                username: user.username,
                message: message
            });
            // tell server to execute 'new message' and send along one parameter
            socket.emit('new message', {
                email: user.email,
                username: user.username,
                message: message
            });
        }
    }

    // Log a message
    function log(message, options) {
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }

    // Adds the visual chat message to the message list
    function addChatMessage(data, options) {
        // Don't fade the message in if there is an 'X was typing'
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $('<span class="username"/>')
            .text(data.username)
            .css('color', getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">')
            .text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
            .data('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    // Adds the visual chat typing message
    function addChatTyping(data) {
        data.typing = true;
        data.message = ' печатает...';
        addChatMessage(data);
    }

    // Removes the visual chat typing message
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    // Adds a message element to the messages and scrolls to the bottom
    // el - The element to add as a message
    // options.fade - If the element should fade-in (default = true)
    // options.prepend - If the element should prepend
    //   all other messages (default = false)
    function addMessageElement(el, options) {
        var $el = $(el);

        // Setup default options
        if (!options) {
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }

        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).html();
    }

    // Updates the typing event
    // Рассылка сообщений активности пользователя.
    function updateTyping() {
        if (connected) {
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
    }

    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Выбор случайного цвета из набора цветов, согласно хешу пользователя
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
    // все, что вводит пользователь с клавиатуры перенаправлять в input форму
    $window.keydown(function (event) {
        // Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }

        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            sendMessage();
            socket.emit('stop typing');
            typing = false;
        }
    });

    $inputMessage.on('input', function () {
        updateTyping();
    });
});