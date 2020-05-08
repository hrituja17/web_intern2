var User = require("../models/user");
var express = require("express");
var router  = express.Router();
//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');




 // classroom Form Home Page
router.get("/",ensureAuthenticated, function(req, res){
    name = req.user.fname+' '+req.user.lname;
    res.render("classroom/classroomforms", {name:name}); 
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