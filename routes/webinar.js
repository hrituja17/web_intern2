var express = require("express");
var router  = express.Router();
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var async = require("async");
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
var nodemailer = require("nodemailer");
var crypto = require("crypto");
router.use(flash());
//Global vars for flash
router.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});



//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');

// Adding database models
var User = require("../models/user");
var Webinar = require("../models/webinar");
var WebinarUser = require("../models/webinaruser");


 // Webinar Form Home Page
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
    res.render("webinar/webinarforms", {name:name, user: req.user}); 
});

// webinar Create Form Submission
router.post("/createwebinar",ensureAuthenticated, function(req, res){
    let errors = [];
    var webinarName = req.body.webinarPurpose.trim();
    var webinarCode = req.body.webinarCode.trim();
    var code = webinarCode;
    var host = {
        id: req.user._id,
        email: req.user.email
    };
    if(!webinarCode || !webinarName){
        errors.push({ msg: 'Please enter an all the required fields!!'});
    }
    if (webinarCode.length < 8) {
        errors.push({ msg: 'Webinar Code must be at least 8 characters'});
    }  
    if (errors.length > 0) {
        res.render('webinar/webinarforms', {
            errors,
            name:name, user: req.user
        });
    } else {
        var webinarId = shortid.generate(12);
        var newWebinar = new Webinar({
            webinarName:webinarName,
            webinarId:webinarId,
            webinarCode:webinarCode,
            host:host
        });
        bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newWebinar.webinarCode,salt,(err,hash)=>{
            if(err) throw err;
            newWebinar.webinarCode = hash;
            newWebinar.save()
                .then(webinar => {
                    async.waterfall([
                        function(done) {
                          crypto.randomBytes(20, function(err, buf) {
                            var token = buf.toString('hex');
                            done(err, token);
                          });
                        },
                        function(token,  done) {
                          var smtpTransport = nodemailer.createTransport({
                            service: 'Gmail', 
                            auth: {
                              user: 'codewithash99@gmail.com',
                               pass: process.env.GMAILPW
                            }
                          });
                          var mailOptions = {
                            to: req.user.email,
                            from: 'codewithash99@gmail.com',
                            subject: 'Redpositive Webinar Details',
                            text: 'You are receiving this because you  have requested to host a webinar.\n\n' +
                                  'Please share the following details to those whom you want to invite to your webinar.\n\n' +
                                  'Webinar Id - ' + webinarId + '\n' + 'Webinar Code - ' + code + '\n\n' 
                          };
                          smtpTransport.sendMail(mailOptions, function(err) {
                            console.log('mail sent');
                            req.flash('success_msg', 'An e-mail has been sent to ' + req.user.email + ' with webinar details.');
                            done(err, 'done');
                          });
                        }
                      ], function(err) {
                        if (err) return next(err);
                          req.flash('success_msg','Your Session details for webinar is sent to your mail !');
                          res.redirect("/webinar");
                      });  
                })
                .catch(err=>console.log(err));
        }));
    }
});

 
// webinar Join Form Submission
router.post("/joinwebinar",ensureAuthenticated, function(req, res){
    let errors = [];
    Webinar.findOne({webinarId:req.body.webinarId})
    .then(webinar => {
        if(!webinar){
            errors.push({ msg: 'There is no such webinar'});
            return res.render("webinar/webinarforms",{errors,name:name, user: req.user});
        }
        // Match Password
        bcrypt.compare(req.body.webinarCode,webinar.webinarCode,(err,isMatch)=>{
            if(err) throw err;
            if(isMatch){
                var isAdmin = false;
                if(req.user.email == webinar.host.email){
                    isAdmin = true;
                } 
                var webinarUser = new WebinarUser({
                    webinarId : webinar._id,
                    userId : req.user._id,
                    isAdmin : isAdmin
                });
                webinarUser.save();
                webinar.webinarUsers.push(req.user._id);
                webinar.save();
                res.redirect("/webinar");
            } else {
                errors.push({ msg: 'Webinar Code is Wrong'});
                res.render("webinar/webinarforms",{errors,name:name, user: req.user});
            }
        });
    })
    .catch(err => console.log(err));
});










module.exports = router;




