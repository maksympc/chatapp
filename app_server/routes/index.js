var express = require('express');
var router = express.Router();

//TODO:импорт начальной страницы
var ctrlMain = require('../controllers/main');
//TODO:импорт страницы чата
var ctrlChat = require('../controllers/chat');
//TODO:маппинг на начальную страницу
router.get('/', ctrlMain.index);
//TODO:маппинг на страницу чата
router.get('/chat', ctrlChat.get);

//TODO get testChat page
router.get('/test', function (req, res, next) {
    res.render('test');
});
router.get('/jwt', ctrlMain.jwt);
//TODO: удалить маппинг и страницу
router.get('/jwt1', ctrlMain.jwt1);
//TODO: экспорт маршрутов для дальнешей с ними работы
module.exports = router;

