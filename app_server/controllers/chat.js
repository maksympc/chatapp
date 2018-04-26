//
// Controller, that mapping to '/chat' path.
//
let path = require('path');

// Used to send chat.html page, using res param
module.exports.get = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'chat.html'));
};