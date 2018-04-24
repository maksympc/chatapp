function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
}

$(document).ready(function () {
    var FADE_TIME = 100; // ms
    var TYPING_TIMER_LENGTH = 500; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];

    var $window = $(window);
    // ссылка на список ul сообщений чата
    var $messages = $('#messages');
    // input message box
    var $inputMessage = $('#inputMessage');

    // object, that contains all token's {email, role, username, exp, iat} fields
    var user = parseJwt(localStorage.token);
    // for typing socket event
    var typing = false;
    // to track users input
    var lastTypingTime;
    // фокусируемся на поле, при вводе сообщения
    var $currentInput = $inputMessage.focus();


    // incoming value
    // TODO: переписать с использованием более сложного объекта сообщения
    function addParticipantsMessage(data) {
        var message = '';
        if (data.numUsers === 1) {
            message += "there's 1 participant";
        } else {
            message += "there are " + data.numUsers + " participants";
        }
        log(message);
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
        var $el = $('<li>').text(message);
        addMessageElement($el, options);
    }

    // создание сообщение-чата в списке сообщений
    // TODO: пересмотреть используемые методы
    function addChatMessage(data, options) {
        var $typingMessages = getTypingMessages(data);
        options = options || {};

        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }
        // создание элемента пользователя
        var $usernameDiv = $('<span class="username"/>').text(data.username).css('color', getUsernameColor(data.username));
        var $messageBodyDiv = $('<span class="messageBody">').text(data.message);

        var typingClass = data.typing ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>').data('username', data.username).addClass(typingClass).append($usernameDiv, $messageBodyDiv);

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
        $messages[0].scrollTop = $messages[0].scrollHeight;
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

    // TODO: пересмотреть функцию
    // Gets the 'X is typing' messages of a user
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


    // dependency will placed in chat.html file
    var socket = io();

    socket.on('connect', function () {
        socket.emit('authenticate', {token: localStorage.token})
            .on('authenticated', function (message) {

                // Whenever the server emits 'login', log the login message
                // {numUsers, messages[], onlineUsers[]}
                socket.on('login', function (data) {

                    // should parse data object
                    // updateOnlineUsers(data.onlineUsers);
                    // updateMessages(data.messages);

                    // Display the welcome message
                    addParticipantsMessage(data.numUsers);
                });

                // Whenever the server emits 'new message', update the chat body
                socket.on('new message', function (data) {
                    addChatMessage(data);
                });

                // Whenever the server emits 'user joined', log it in the chat body
                socket.on('user joined', function (data) {
                    // update online users
                    // updateOnlineUsers(data.users);
                    log(data.username + ' joined');
                    addParticipantsMessage(data.numUsers);
                });

                // Whenever the server emits 'user left', log it in the chat body
                socket.on('user left', function (data) {
                    log(data.username + ' left');
                    // updateOnlineUsers(data.onlineUsers)
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


            })
            .on('disconnect', function () {
                localStorage.token = null;
                alert('you have been disconnected');
                window.location.replace(window.location.href.slice(0, -3));
            })
            .on('reconnect', function () {
                alert('you have been reconnected');
            })
            .on('reconnect_error', function () {
                localStorage.token = null;
                alert('attempt to reconnect has failed');
            });
    });

})
;