//
var path = require('path');
module.exports.index = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'login.html'));
};
// jwt test page
module.exports.jwt = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'jwttest.html'));
};