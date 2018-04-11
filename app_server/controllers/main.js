//TODO: контроллер отвечает за выдачу главной страницы приложениея
module.exports.index = function (req, res, next) {
    res.render('index', {title: 'ChatApp. Login page'});
};