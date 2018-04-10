// var passport = require('passport');
// var mongoose = require('mongoose');
// var User = mongoose.model('User');
//
// var sendJSONresponse = function (res, status, content) {
//     res.status(status);
//     res.json(content);
// };
//
// //TODO: update registration process, necessary field could be changed
// module.exports.register = function (req, res) {
//     if (!req.body.username || !req.body.email || !req.body.password) {
//         sendJSONresponse(res, 400, {'message': 'All fields required'});
//         return;
//     }
//
//     var user = new User();
//     user.username = req.body.username;
//     user.email = req.body.email;
//
//     user.setPassword(req.body.password);
//     user.save(function (err) {
//         var token;
//         if (err) {
//             sendJSONresponse(res, 404, err);
//         } else {
//             token = user.generateJwt();
//             sendJSONresponse(res, 200, {'token': token}); // send token back to browser
//         }
//     });
// };
//
// module.exports.login = function (req, res) {
//     if (!req.body.username || !req.body.email || !req.body.password) {
//         sendJSONresponse(res, 400, {'message': 'All fields required'});
//         return;
//     }
//
//     passport.authenticate('local', function (err, user, info) {
//         var token;
//         // return error, if passport returns error
//         if (err) {
//             sendJSONresponse(res, 404, err);
//             return;
//         }
//         if (user) {
//             token = user.generateJwt();
//             sendJSONresponse(res, 200, {'token': token});
//         } else {
//             sendJsonResponse(res, 401, info);
//         }
//     })(req, res);
// };