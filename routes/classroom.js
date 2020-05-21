var User = require("../models/user");
var express = require("express");
var router  = express.Router();
var crypto = require("crypto");
//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');




 // classroom Form Home Page
router.get("/",ensureAuthenticated, function(req, res){
    var id = req.user._id;
    var key = id.toString();
    var fdcipher = crypto.createDecipher('aes-256-cbc',key);
    var ldcipher = crypto.createDecipher('aes-256-cbc',key);
    var fnameDcrypted = fdcipher.update(req.user.fname,'hex','utf8');
    var lnameDcrypted = ldcipher.update(req.user.lname,'hex','utf8');
    fnameDcrypted += fdcipher.final('utf8');
    lnameDcrypted += ldcipher.final('utf8');     
    name = fnameDcrypted +' '+ lnameDcrypted;
    fnameDcrypted = null;
    lnameDcrypted = null;
    res.render("classroom/classroomforms", {name:name, user: req.user}); 
});


// classroom Create Form Submission
router.post("/createclassroom",ensureAuthenticated, function(req, res){
    console.log(req.body);
    res.redirect("/classroom");
});
 
// classroom Join Form Submission
router.post("/joinclassroom",ensureAuthenticated, function(req, res){
    console.log(req.body);
    res.redirect("/classroom");
});








module.exports = router;