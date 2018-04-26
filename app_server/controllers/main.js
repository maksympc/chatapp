//
// Controller, that mapping to '/' path.
//
var path = require('path');

// Used to send index.html page, using res param
module.exports.index = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
};