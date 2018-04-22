//TODO: описание контроллера для работы со страницей чата. ('/chat')
//TODO: обработка get-запроса по данному мапингу
let path = require('path');
module.exports.get = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'chat.html'));
};
