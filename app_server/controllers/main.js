//
var path = require('path');
module.exports.index = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
};