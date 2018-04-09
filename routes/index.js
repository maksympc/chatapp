var express = require('express');
var path    = require("path");
var router = express.Router();

/* GET home     page. */
router.get('/', function(req, res, next) {
  res.sendFile(path.join(path.dirname(module.parent.filename),'/views/main.html'));
});

router.get('/chat', function(req, res, next) {
    res.sendFile(path.join(path.dirname(module.parent.filename),'/views/chat.html'));
});

//redirect to router
router.post('/chat',function(req,res,next){
    console.log("body:" + JSON.stringify(req.body));
    res.username = req.body.username;
    res.sendFile(path.join(path.dirname(module.parent.filename),'/views/chat.html'));
});

module.exports = router;

