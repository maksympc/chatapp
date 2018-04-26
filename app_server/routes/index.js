//
// This module contains logic, that mapped request to root '/' path
//
var express = require('express');
var router = express.Router();

var ctrlMain = require('../controllers/main');
var ctrlChat = require('../controllers/chat');
var ctrlLogin = require('../../app_api/controllers/authentication');

// Should return index page as a response
router.get('/', ctrlMain.index);

// Should return chat page as a response
router.get('/chat', ctrlChat.get);

// Request should contains user credentials and should return jwt-token as a response in json format.
router.post('/login', ctrlLogin.login);

module.exports = router;