var express = require('express');
var router = express.Router();

var ctrlMessages = require('../controllers/messages');
var ctrlUsers = require('../controllers/users');
var ctrlAuthentication = require('../controllers/authentication');

//TODO:messages API mapping
router.get('/messages', ctrlMessages.getAllMessages);
router.post('/messages', ctrlMessages.addMessage);

//TODO:users API mapping
router.get('/users', ctrlUsers.getAllUsers);
router.post('/users', ctrlUsers.createOrUpdateUser);
router.post('/users/ban/:email', ctrlUsers.banUser);
router.post('/users/unban/:email', ctrlUsers.unbanUser);
router.post('/users/mute/:email', ctrlUsers.muteUser);
router.post('/users/unmute/:email', ctrlUsers.unmuteUser);
router.post('/users/online/:email', ctrlUsers.onlineUser);
router.post('/users/offline/:email', ctrlUsers.offlineUser);

//TODO:authentication mapping, combine register and login logic
router.post('/register', ctrlAuthentication.register);
router.post('/login', ctrlAuthentication.login);

module.exports = router;