//TODO: used to work as API with users
var mongoose = require('mongoose');
var users = mongoose.model('User');

var updateJsonResponse = function (res, status, content) {
    res.status(status);
    res.json(content);
};

module.exports.getAllUsers = function (req, res) {
    users.find().exec(
        function (err, users) {
            if (err) {
                updateJsonResponse(res, 404, err);
                return;
            }
            updateJsonResponse(res, 200, users);
        }
    );
};

module.exports.banUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({ban: false});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't ban user. Cause: Not found, email is required!"});
    }
};

module.exports.unbanUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({ban: false});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't unban user. Cause: Not found, email is required!"});
    }
};

module.exports.muteUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({mute: true});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't mute user. Cause: Not found, email is required!"});
    }
};

module.exports.unmuteUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({mute: false});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't unmute user. Cause: Not found, email is required!"});
    }
};

module.exports.onlineUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({online: true});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't set user online. Cause: Not found, email is required!"});
    }
};

module.exports.offlineUser = function (req, res) {
    // get user email as request param
    var userEmail = req.params.email;
    // update user status
    if (userEmail) {
        users.find({'email': userEmail})
            .exec(function (err, user) {
                if (err) {
                    updateJsonResponse(res, 404, err);
                } else {
                    user.push({online: false});
                    user.save(function (err, user) {
                        if (err) {
                            updateJsonResponse(res, 404, err);
                        } else {
                            updateJsonResponse(res, 201, user);
                        }
                    });
                }
            });
    } else {
        updateJsonResponse(res, 404, {"message": "Can't set user offline. Cause: Not found, email is required!"});
    }
};


module.exports.createOrUpdateUser = function (req, res) {
    console.log(req.body);

    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;


    if (email && username && password) {
        users.update(
            //query
            {email: email},
            //TODO: hide plain password, will be changed to HASH value
            {email: email, username: username, password: password},
            // if user is absent, this options will create new one
            {upsert: true, setDefaultsOnInsert: true},
            //callback, after fulfilling operation
            function (err, user) {
                if (err) {
                    updateJsonResponse(res, 400, err);
                } else {
                    updateJsonResponse(res, 201, user);
                }
            });
    }
    else {
        updateJsonResponse(res, 404, {"message": "Can't create/update user. Cause: email, username, password is required!"});
    }

};