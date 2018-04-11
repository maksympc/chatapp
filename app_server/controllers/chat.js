//TODO: описание контроллера для работы со страницей чата. ('/chat')
//TODO: обработка get-запроса по данному мапингу
module.exports.get = function (req, res, next) {
    res.render('chat', {title: 'ChatApp. Chat page', username: 'empty'});
};
//TODO: обработка post-запроса по данному мапингу
module.exports.post = function (req, res, next) {
    console.log("body:" + JSON.stringify(req.body));
    res.render('chat', {title: 'ChatApp. Chat page', username: 'empty', username: req.body.username.toString()});
};
