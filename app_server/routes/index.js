var express = require('express');
var router = express.Router();

//var ctrlAuth = require('./controllers/authentication');

//TODO:импорт начальной страницы
var ctrlMain = require('../controllers/main');
//TODO:маппинг на начальную страницу
router.get('/', ctrlMain.index);



router.get('/chat', function (req, res, next) {
    res.render('chat', {title: 'ChatApp. Chat page', username: 'empty'});
});

router.post('/chat', function (req, res, next) {
    console.log("body:" + JSON.stringify(req.body));
    res.render('chat', {title: 'ChatApp. Chat page', username: 'empty', username: req.body.username.toString()});
});

//TODO: экспорт маршрутов для дальнешей с ними работы
module.exports = router;

