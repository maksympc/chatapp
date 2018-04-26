//
// This module contains logic, that mapping request to /api/ path
//
var express = require('express');
var router = express.Router();
var ctrlMessages = require('../controllers/messages');
var ctrlUsers = require('../controllers/users');
var ctrlAuthentication = require('../controllers/authentication');

// used as API to get all stored messages in DB
router.get('/messages', ctrlMessages.getAllMessages);

// used as API to get all stored users in DB
router.get('/users', ctrlUsers.getAllUsers);

// used as API to get all stored users in DB
router.post('/login', ctrlAuthentication.login);

module.exports = router;