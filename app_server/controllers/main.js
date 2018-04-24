//
var path = require('path');
module.exports.index = function (req, res, next) {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
};
// // jwt test page
// module.exports.jwt = function (req, res, next) {
//     res.sendFile(path.join(__dirname, '../views', 'jwttest.html'));
// };
//
// // fake jwt test page
// module.exports.jwt1 = function (req, res, next) {
//     res.sendFile(path.join(__dirname, '../views', 'jwttest1.html'));
// };