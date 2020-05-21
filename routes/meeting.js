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
var Meeting = require("../models/meeting");
var MeetingUser = require("../models/meetinguser");


 // Meeting Form Home Page
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
    res.render("meeting/meetingforms", {name:name, user: req.user}); 
 });

// meeting Create Form Submission
router.post("/createmeeting",ensureAuthenticated, function(req, res){
    let errors = [];
    var meetingName = req.body.meetingPurpose.trim();
    var meetingCode = req.body.meetingCode.trim();
    var code = meetingCode;
    var host = {
        id: req.user._id,
        email: req.user.email
    };
    if(!meetingCode || !meetingName){
        errors.push({ msg: 'Please enter all the required fields!!'});
    }
    if (meetingCode.length < 8) {
        errors.push({ msg: 'Meeting Code must be at least 8 characters'});
    }  
    if (errors.length > 0) {
        res.render('meeting/meetingforms', {
            errors,name:name, user: req.user
        });
    } else {
        var meetingId = shortid.generate(12);
        var newMeeting = new Meeting({
            meetingName:meetingName,
            meetingId:meetingId,
            meetingCode:meetingCode,
            host:host
        });
        bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newMeeting.meetingCode,salt,(err,hash)=>{
            if(err) throw err;
            newMeeting.meetingCode = hash;
            newMeeting.save()
                .then(meeting => {
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
                            subject: 'Redpositive Meeting Details',
                            text: 'You are receiving this because you have requested to host a meeting.\n\n' +
                                  'Please share the following details to those whom you want to invite to your meeting.\n\n' +
                                  'Meeting Id - ' + meetingId + '\n' + 'Meeting Code - ' + code + '\n\n' 
                          };
                          smtpTransport.sendMail(mailOptions, function(err) {
                            req.flash('success_msg', 'An e-mail has been sent to ' + req.user.email + ' with meeting details.');
                            done(err, 'done');
                          });
                        }
                      ], function(err) {
                        if (err) return next(err);
                          req.flash('success_msg','Your Session details for meeting has been sent to your mail !');
                          res.redirect("/meeting");
                      });  
                })
                .catch(err=>console.log(err));
        }));
    }
});

 
// meeting Join Form Submission
router.post("/joinmeeting",ensureAuthenticated, function(req, res){
    let errors = [];
    Meeting.findOne({meetingId:req.body.meetingId})
    .then(meeting => {
        if(!meeting){
            errors.push({ msg: 'There is no such meeting'});
            return res.render('meeting/meetingforms', {
                errors,name:name, user: req.user
            });
        }
        // Match Password
        bcrypt.compare(req.body.meetingCode,meeting.meetingCode,(err,isMatch)=>{
            if(err) throw err;
            if(isMatch){
                var isAdmin = false;
                if(req.user.email == meeting.host.email){
                    isAdmin = true;
                } 
                var meetingUser = new MeetingUser({
                    meetingId : meeting._id,
                    userId : req.user._id,
                    isAdmin : isAdmin
                });
                meetingUser.save();
                meeting.meetingUsers.push(req.user._id);
                meeting.save();
                res.redirect("/meeting/" + meeting._id);
            } else {
                req.flash('error_msg','The meeting code is incorrect!');
                res.render("meeting/meetingforms",{name:name, user: req.user});
            }
        });
    })
    .catch(err => console.log(err));
});



router.get('/:id', (req, res) => {
    res.send('Meeting page');
});




module.exports = router;