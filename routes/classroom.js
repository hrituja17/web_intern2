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
var classroom = require("../models/classroom");
var classroomUser = require("../models/classroomuser");
 // classroom Form Home Page
router.get("/",ensureAuthenticated, function(req, res){
    name = req.user.fname+' '+req.user.lname;
    res.render("classroom/classroomforms", {name:name, user: req.user}); 
});



// classroom Create Form Submission
router.post("/createclassroom",ensureAuthenticated, function(req, res){
    let errors = [];
    var classroomName = req.body.classroomPurpose.trim();
    var classroomCode = req.body.classroomCode.trim();
    var code = classroomCode;
    var host = {
        id: req.user._id,
        email: req.user.email
    };
    if(!classroomCode || !classroomName){
        errors.push({ msg: 'Please enter all the required fields!!'});
    }
    if (classroomCode.length < 8) {
        errors.push({ msg: 'classroom Code must be at least 8 characters'});
    }  
    if (errors.length > 0) {
        res.render('classroom/classroomforms', {
            errors,name:name, user: req.user
        });
    } else {
        var classroomId = shortid.generate(12);
        var newclassroom = new classroom({
            classroomName:classroomName,
            classroomId:classroomId,
            classroomCode:classroomCode,
            host:host
        });
        bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newclassroom.classroomCode,salt,(err,hash)=>{
            if(err) throw err;
            newclassroom.classroomCode = hash;
            newclassroom.save()
                .then(classroom => {
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
                            subject: 'Redpositive classroom Details',
                            text: 'You are receiving this because you have requested to host a classroom.\n\n' +
                                  'Please share the following details to those whom you want to invite to your classroom.\n\n' +
                                  'classroom Name - ' + classroomName + '\n' + 'classroom Id - ' + classroomId + '\n' + 'classroom Code - ' + code + '\n\n' 
                          };
                          smtpTransport.sendMail(mailOptions, function(err) {
                            req.flash('success_msg', 'An e-mail has been sent to ' + req.user.email + ' with classroom details.');
                            done(err, 'done');
                          });
                        }
                      ], function(err) {
                        if (err) console.log(err);
                          req.flash('success_msg','Your Session details for classroom has been sent to your mail !');
                          res.redirect("/classroom");
                      });  
                })
                .catch(err=>console.log(err));
        }));
    }
});
 
// classroom Join Form Submission
router.post("/joinclassroom",ensureAuthenticated, function(req, res){
    let errors = [];
    Classroom.findOne({classroomId:req.body.classroomId})
    .then(classroom => {
        if(!classroom){
            errors.push({ msg: 'There is no such classroom'});
            return res.render('classroom/classroomforms', {
                errors,name:name, user: req.user
            });
        }
        // Match Password
        bcrypt.compare(req.body.classroomCode,classroom.classroomCode,(err,isMatch)=>{
            if(err) throw err;
            if(isMatch){
                var isAdmin = false;
                if(req.user.email == classroom.host.email){
                    isAdmin = true;
                } 
                var classroomUser = new ClassroomUser({
                    classroomId : classroom._id,
                    userId : req.user._id,
                    isAdmin : isAdmin
                });
                classroomUser.save();
                classroom.classroomUsers.push(req.user._id);
                classroom.save();
                res.redirect("/classroom/joinclassroom/" + classroom._id);
            } else {
                req.flash('error_msg','The classroom code is incorrect!');
                res.render("classroom/classroomforms",{name:name, user: req.user});
            }
        });
    })
    .catch(err => console.log(err));
});





router.get("/joinclassroom/:id",ensureAuthenticated, (req, res) => {
    res.render('classroom/classroomroom', {user: req.user});
})







module.exports = router;


