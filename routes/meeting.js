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
    name = req.user.fname+' '+req.user.lname;
    res.render("meeting/meetingforms", {name:name, user: req.user}); 
 });

// meeting Create Form Submission
router.post("/createmeeting",ensureAuthenticated, function(req, res){
    // console.log(req.body);
    let errors = [];
    var meetingName = req.body.meetingPurpose.trim();
    // var meetingId = req.body.meetingId.trim();
    var meetingCode = req.body.meetingCode.trim();
    var code = meetingCode;
    var host = {
        id: req.user._id,
        email: req.user.email
    };
    // console.log(meetingName+" "+meetingId+" "+meetingCode+" "+host.id+" "+host.email);
    if(!meetingCode || !meetingName){
        errors.push({ msg: 'Please enter all the required fields!!'});
    }
    // if (meetingId.length < 6) {
    //     errors.push({ msg: 'Meeting Id must be at least 6 characters' });
    // }
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
                                  'Meeting Name - ' + meetingName + '\n' + 'Meeting Id - ' + meetingId + '\n' + 'Meeting Code - ' + code + '\n\n' 
                          };
                          smtpTransport.sendMail(mailOptions, function(err) {
                            console.log('mail sent');
                            req.flash('success', 'An e-mail has been sent to ' + req.user.email + ' with meeting details.');
                            done(err, 'done');
                          });
                        }
                      ], function(err) {
                        if (err) console.log(err);
                          req.flash('success','Your Session details for meeting is sent to your mail !');
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
                res.redirect("/meeting/joinmeeting/" + meeting._id);
            } else {
                req.flash('error','The meeting code is wrong');
                res.render("meeting/meetingforms",{name:name, user: req.user});
            }
        });
    })
    .catch(err => console.log(err));
});


router.get("/joinmeeting/:id",ensureAuthenticated, (req, res) => {
    res.render('meeting/meetingroom', {user: req.user});
})





module.exports = router;