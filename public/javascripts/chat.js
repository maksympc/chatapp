// COLORS for username and avatar icon
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

// Parse JWT token, used to get payload params
function parseJwt(token) {
    if ((typeof token !== 'undefined') && (typeof token !== 'null')) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(window.atob(base64));
    }
}

//Convert date to string
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
    const MESSAGE_SEND_MILLISECONDS_TIMEOUT = 3 * 1000;
    var lastTimeMessageSend;


    // initialize necessary elements
    var $window = $(window);
    var $messages = $('#messages');
    var $inputMessage = $('#inputMessage');
    var $onlineUsersUl = $('#onlineUsersUl');
    var $allUsersUl = $('#allUsersUl');
    var $infoUl = $('#infoUl');
    var user = parseJwt(localStorage.token);
    var typing = false;
    var lastTypingTime;
    var $currentInput = $inputMessage.focus();
    var $logoutBtn = $('#logoutId');
    var $profileBtn = $('#profileId');
    var socket = io();
    var $modalRoot;

    // create profile modal window
    function createProfileModal(userItem) {

        // 1. root
        $modalRoot = $('<div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">');
        //  2. modal content
        let $modalDialog = $('<div class="modal-dialog" role="document">');
        let $modalContent = $('<div class="modal-content">');
        // 3. header
        let $modalHeader = $('<div class="modal-header">');
        let $modalHeaderTitle = $('<h5 class="modal-title" id="exampleModalLabel">').text('Profile settings');
        let $modalHeaderCloseSpan = $('<span aria-hidden="true">').text('x'); // change to &times; value
        let $modalHeaderClose = $('<button type="button" class="close" data-dismiss="modal" aria-label="Close">').append($modalHeaderCloseSpan);
        // 3.1 append to header
        $modalHeader.append($modalHeaderTitle, $modalHeaderClose);


        // 4. body
        let $modalBody = $('<div class="modal-body">');
        let $profileView = $('<div class="d-flex flex-column">');
        // avatar
        let $profileIcon = $('<i class="fa fa-user align-self-center profileAvatarIcon">').css('color', getUsernameColor(userItem.username));
        let $profileAvatar = $('<div class="p-2 d-flex justify-content-center">').append($profileIcon);
        //user info table
        let $profileInfoTable = $('<table class="table table-bordered table-hover">');
        let $profileInfoTableTbody = $('<tbody>');
        let $profileInfoTableUsername = $('<tr>').append($('<th scope="row">').text('Usename:'), $('<td>').text(userItem.username));
        let $profileInfoTableEmail = $('<tr>').append($('<th scope="row">').text('Email:'), $('<td>').text(userItem.email));
        let $profileInfoTableRole = $('<tr>').append($('<th scope="row">').text('Role:'), $('<td>').text(userItem.role));
        // construct element
        $profileInfoTableTbody.append($profileInfoTableUsername, $profileInfoTableEmail, $profileInfoTableRole);
        $profileInfoTable.append($profileInfoTableTbody);
        $profileView.append($profileAvatar, $profileInfoTable);
        $modalBody.append($profileView);

        // 5. footer
        let $footerCloseBtn = $('<button type="button" class="btn btn-secondary" data-dismiss="modal">').text('Close');
        let $modalFooter = $('<div class="modal-footer">').append($footerCloseBtn);
        // 6. Construct modal element
        $modalContent.append($modalHeader, $modalBody, $modalFooter);
        $modalDialog.append($modalContent);
        $modalRoot.append($modalDialog);
    }


    function bindProfileButton() {
        $profileBtn.click(function () {
            $modalRoot.modal('show');
        });
    }


    // set up chat page elements for current user
    // check role and status
    (function () {
        console.log("mute:" + user.mute);
        if (user.role != 'admin') {
            $('#allUsersId').remove();
        }
        if (user.mute == true) {
            $inputMessage.prop("disabled", true);
        }
    }());


    // Create and render message, if number of online users has changed
    function addParticipantsMessage(numUsers) {
        var message = '';
        if (numUsers === 1)
            message += "there's 1 participant online";
        else
            message += "there are " + numUsers + " participants online";
        log(message);
        log('________________________________');
    }


    // Prevents input from having injected markup
    function cleanInput(input) {
        return $('<div/>').text(input).html();
    }


    // Firstly check last message sending time, if ok, emit 'new message' event for all other users.
    // If not ok, notifies user, that he should wait for some time. Add message to Info messages list.
    function sendMessage() {
        // check last message send time
        if (lastTimeMessageSend) {
            if (MESSAGE_SEND_MILLISECONDS_TIMEOUT > (Date.now() - lastTimeMessageSend)) {
                createInfoListItem("Before sending, you should wait " + ((MESSAGE_SEND_MILLISECONDS_TIMEOUT - (Date.now() - lastTimeMessageSend)) / 1000).toFixed(2) + " sec");
                return;
            }
        }
        let message = $inputMessage.val();
        lastTimeMessageSend = Date.now();
        message = cleanInput(message);
        if (message) {
            $inputMessage.val('');
            socket.emit('new message', {email: user.email, username: user.username, message: message})
        }
    }

    // Render message, with provided message to message area.
    function log(message, options) {
        var $el = $('<li>').text(message).css('text-align', 'center').css('color', '#669999');
        addMessageElement($el, options);
    }

    // Create message element <li> with provided data and options.
    function addChatMessage(data, options) {
        // check if user typing
        var $typingMessages = getTypingMessages(data);
        options = options || {};

        // delete element from messages list
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        // create new element of list
        let $messageDiv = $('<li class="d-flex"/>');
        // if message contains createdOn param, should create 'normal' message
        if (data.createdOn) {

            // 1. Avatar and name
            let $avatarArea = $('<div class="d-flex flex-column align-items-center message-avatar"/>');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"/>').css('color', getUsernameColor(data.username));
            let $username = $('<div/>').text(data.username).css('color', getUsernameColor(data.username));
            $avatarArea.append($avatar, $username);

            // 2. Message body and time
            let $messageArea = $('<div class="container-fluid d-flex flex-column"/>');
            let $message = $('<div>').text(data.message).css('color', getUsernameColor(data.username));
            let $time = $('<div class="mt-auto p-2 align-self-end message-time">').text(dateToString(data.createdOn));
            $messageArea.append($message, $time);

            // 3. append all in root li element
            $messageDiv.addClass('message-container').append($avatarArea, $messageArea);
        }
        // if informational message
        else {

            // get typing class
            let typingClass = data.typing ? 'typing' : '';

            // 1. Name
            let $username = $('<div/>').text(data.username).css('color', getUsernameColor(data.username));

            // 2. is typing...
            let $message = $('<div>').text(data.message).css('padding-left', '5px');

            // 3. append all in root li element
            $messageDiv.data('username', data.username).addClass('message').addClass(typingClass).append($username, $message);
        }
        // append <li> element to root <ul> message list
        addMessageElement($messageDiv, options);
    }

    // Render, that someone is typing...
    function addChatTyping(data) {
        data.typing = true;
        data.message = 'is typing...';
        addChatMessage(data);
    }

    // Remove, that someone is typing...
    function removeChatTyping(data) {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        })
    }

    // re-render message <ul> list, with new data
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
    // all other messages (default = false)
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


    // Render new users[] in #onlineUsersUl
    function updateOnlineUsersList(data) {
        // clear area
        $onlineUsersUl.empty();
        // for all items create <li> element and then render them
        data.forEach((user, index, onlineUsers) => {

            let $rootLi = $('<li class="list-inline-item text-center userLiItem"/>');
            // 1. avatar
            let $avatarArea = $('<div class="d-none d-md-block d-xl-block">');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"></i>').css('color', getUsernameColor(user.username));
            $avatarArea.append($avatar);
            // 2. username
            let $onlineSuccess = $('<i class="fa fa-circle"></i>').css('color', '#66de28');
            let $name = $('<span/>').text(' ' + user.username).css('color', getUsernameColor(user.username));
            let $username = $('<div/>').append($onlineSuccess, $name);
            // 3. append to <li> element
            $rootLi.append($avatarArea, $username);
            // 4. render root li element. Append to <ul> onlineUsersUl list element
            addOnlineUserElement($rootLi);
        });
    }

    // Append to <ul> onlineUsersUl list element
    function addOnlineUserElement(el) {
        $onlineUsersUl.append(el);
        $('#onlineUsersDiv').animate({
            scrollLeft: $onlineUsersUl[0].scrollWidth
        }, 'fast');
    }

    // Render all users[] in #allUsersUl, must use for admins only!
    function updateAllUsersList(data) {
        $allUsersUl.empty();
        data.forEach((user, index, onlineUsers) => {
            // 1. root <li> element
            let $rootLi = $('<li class="list-inline-item text-center userLiItem"/>');
            // 2. Avatar
            let $avatarArea = $('<div class="d-none d-md-block d-xl-block">');
            let $avatar = $('<i class="fa fa-user usersAvatarIcon"></i>').css('color', getUsernameColor(user.username));
            $avatarArea.append($avatar);
            // 3. Username
            let $username = $('<div/>').text(user.username).css('color', getUsernameColor(user.username));
            // 4. Buttons for admin
            let $buttonGroup = $('<div class="btn-group"/>');
            // 4.1 Ban button
            let $buttonBan = $('<button type="button" class="btn btn-danger btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('ban user', $(this).data('email'));
                })
                .append('<i class="fa fa-remove managingIcon"/>');
            // 4.2 Mute button
            let $buttonMute = $('<button type="button" class="btn btn-warning btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('mute user', $(this).data('email'));
                })
                .append('<i class="fa fa-volume-off managingIcon"/>');
            // 4.3 Unmute button
            let $buttonUnmute = $('<button type="button" class="btn btn-info btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('unmute user', $(this).data('email'));
                })
                .append('<i class="fa fa-volume-up managingIcon"/>');
            // 4.4 Unban button
            let $buttonUnban = $('<button type="button" class="btn btn-success btn-sm btn-admin-btn"/>')
                .data('email', user.email)
                .click(function () {
                    socket.emit('unban user', $(this).data('email'));
                })
                .append('<i class="fa fa-user-plus managingIcon"/>');
            // 5. Append all buttons to buttonGroup element
            $buttonGroup.append($buttonBan, $buttonMute, $buttonUnmute, $buttonUnban);
            // 6. Append all elements to root <li> element
            $rootLi.append($avatarArea, $username, $buttonGroup);
            // 7. render root li element
            addAllUserElement($rootLi);
        });
    }

    // Append user element to allUser area
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
    function getTypingMessages(data) {
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }

    // Gets the color of a username through hash function
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

        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (user) {
                sendMessage();
                socket.emit('stop typing');
                typing = false;

            }
        }
    });

    // Inform, that user is typing...
    $inputMessage.on('input', function () {
        updateTyping();
    });


    // Click events
    // Focus input when clicking on the message input's border
    $inputMessage.click(function () {
        $inputMessage.focus();
    });

    // logout
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

                    createProfileModal(user);
                    bindProfileButton();
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


                // get all users. Only for admins
                socket.on('get all users', function (data) {
                    updateAllUsersList(data.users);
                });


                // inform that someone was banned
                socket.on('banned', function (data) {
                    createInfoListItem(data.message);
                });


                // inform that someone was unbanned
                socket.on('unbanned', function (data) {
                    createInfoListItem(data.message);
                });


                // inform message
                socket.on('info', function (data) {
                    createInfoListItem(data.message);
                });


                // mute user by email. Only for admin
                socket.on('mute user', function (data) {
                    createInfoListItem(data.message);
                    $inputMessage.prop("disabled", true);
                });


                // unmute user by email. Only for admin
                socket.on('unmute user', function (data) {
                    console.log('unmute:' + JSON.stringify(data));
                    createInfoListItem(data.message);
                    $inputMessage.prop("disabled", false);
                });


                // inform that someone was muted
                socket.on('muted', function (data) {
                    createInfoListItem(data.message);
                });


                // inform that someone was unmuted
                socket.on('unmuted', function (data) {
                    createInfoListItem(data.message);
                });


                // remove all messages. Only for admin
                socket.on('remove all messages', function () {
                    console.log('remove all messages!');
                });
            })
            .on('disconnect', function () {
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