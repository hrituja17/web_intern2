var User = require("../models/user");
var express = require("express");
var router  = express.Router();
//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');


 // Webinar Form Home Page
router.get("/",ensureAuthenticated, function(req, res){
    name = req.user.fname+' '+req.user.lname;
    res.render("webinar/webinarforms", {name:name}); 
});

// Webinar Create Form Submission
router.post("/createwebinar",ensureAuthenticated, function(req, res){
    const {webinarname, webinarid, webinarcode} = req.body;
    console.log(req.body);
    res.redirect("/webinar");
});
 
// Webinar Join Form Submission
router.post("/joinwebinar",ensureAuthenticated, function(req, res){
    const {webinarid, webinarcode} = req.body;
    console.log(req.body);
    res.redirect("/webinar");
});








module.exports = router;




