//TODO: описание контроллера для работы со страницей чата. ('/chat')
//TODO: обработка get-запроса по данному мапингу
let path = require('path');
module.exports.get = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'chat.html'));
};

module.exports.post = function (req, res, next) {
    console.log("body:" + JSON.stringify(req.body));
    res.render('chat', {title: 'ChatApp. Chat page', username: 'empty', username: req.body.username.toString()});
};
