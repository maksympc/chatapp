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
//TODO:маппинг с отправкой данных на страницу чата
router.post('/chat', ctrlChat.post);

//TODO: экспорт маршрутов для дальнешей с ними работы
module.exports = router;
