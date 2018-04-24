var express = require('express');
var router = express.Router();

var ctrlMain = require('../controllers/main');
var ctrlChat = require('../controllers/chat');
var ctrlLogin = require('../../app_api/controllers/authentication');

//TODO:маппинг на начальную страницу
router.get('/', ctrlMain.index);
//TODO:маппинг на страницу чата
router.get('/chat', ctrlChat.get);

router.post('/login', ctrlLogin.login);

//TODO get testChat page
// router.get('/test', function (req, res, next) {
//     res.render('test');
// });
// router.get('/jwt', ctrlMain.jwt);
// //TODO: удалить маппинг и страницу
// router.get('/jwt1', ctrlMain.jwt1);
//TODO: экспорт маршрутов для дальнешей с ними работы
module.exports = router;

