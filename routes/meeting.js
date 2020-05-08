var User = require("../models/user");
var express = require("express");
var router  = express.Router();
//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');




 // Meeting Form Home Page
router.get("/",ensureAuthenticated, function(req, res){
    name = req.user.fname+' '+req.user.lname;
    res.render("meeting/meetingforms", {name:name}); 
 });

// meeting Create Form Submission
router.post("/createmeeting",ensureAuthenticated, function(req, res){
    console.log(req.body);
    res.redirect("/meeting");
});
 
// meeting Join Form Submission
router.post("/joinmeeting",ensureAuthenticated, function(req, res){
    console.log(req.body);
    res.redirect("/meeting");
});








module.exports = router;