var express = require('express');
var router = express.Router();

/* GET home     page. */
router.get('/', function(req, res, next) {
  res.render('index',{title:'ChatApp. Login page'});
});

router.get('/chat', function(req, res, next) {
    res.render('chat',{title:'ChatApp. Chat page', username:'empty'});
});

router.post('/chat',function(req,res,next){
    console.log("body:" + JSON.stringify(req.body));
    res.render('chat',{title:'ChatApp. Chat page', username:'empty', username:req.body.username.toString()});
});

module.exports = router;

