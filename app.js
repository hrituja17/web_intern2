require('dotenv').config();
var express = require("express");
var expressLayouts = require('express-ejs-layouts'); 
var app = express();
var bodyparser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var bcrypt = require('bcryptjs');
var flash = require('connect-flash');
var session = require('express-session');
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
app.locals.moment = require('moment');
// Model
var User = require("./models/user");

// Routes
var webinarRoutes   = require("./routes/webinar"),
    meetingRoutes    = require("./routes/meeting"),
    classroomRoutes= require("./routes/classroom");



mongoose.connect("mongodb://localhost:27017/version1", {useNewUrlParser:true})
    .then(()=>console.log('MongoDB Connected....'))
    .catch(err => console.log(err));
app.use(bodyparser.urlencoded({extended: true}));
//Express session

app.set("view engine","ejs");
app.use(express.static(__dirname+"/public"));
//===============================================
//PASSPORT CONFIGURATION
//===============================================
app.use(session({
    secret : "secret code",
    resave : true,
    saveUninitialized  : true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//Global vars for flash
app.use((req,res,next)=>{
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});
//ensure Authentication
var {ensureAuthenticated} = require('./middleware/auth');



//root route
app.get("/", function(req, res){
    res.render("landing");
});

//About route
app.get("/about", function(req, res){
    res.send("About Page");
});

//Pricing Route
app.get("/pricing", function(req, res){
    res.send("Pricing route");
});

// show register form
app.get("/register", function(req, res){
    res.render("register", {page: 'register'}); 
 });

// register handle
app.post('/register',function(req,res){
    let errors = [];
    const {fname,lname,email,password,confirmpassword} = req.body;
    if (password != confirmpassword) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
      }
    
      if (errors.length > 0) {
        res.render('register', {
          errors
        });
      } else {
    //Check if the user exists
    User.findOne({email:email})
        .then(user => {
            if(user) {
                // User exists
                errors.push({msg:'User already exists'});
                res.render('register',{
                    errors
                });
            } else {
                const newUser = new User({
                    fname,
                    lname,
                    email,
                    password
                });
                //Hash Password
                bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(newUser.password,salt,(err,hash)=>{
                    if(err) throw err;
                    //set password to hash
                    newUser.password = hash;
                    newUser.save()
                        .then(user => {
                            req.flash('success_msg','You are now registered and can login');
                            res.redirect("/login");
                        })
                        .catch(err=>console.log(err));
                }))
            }
        });
      }
});

 //show login form
app.get("/login", function(req, res){
    res.render("login", {page: 'login'}); 
 });

//Login handle
//Setting up a strategy : Passport Middleware
passport.use(
    new LocalStrategy({usernameField:'email'},(email,password,done)=>{
        //Match User
        User.findOne({email:email})
            .then(user => {
                if(!user){
                    return done(null,false,{message: 'That email is not registered'});
                }
                // Match Password
                bcrypt.compare(password,user.password,(err,isMatch)=>{
                    if(err) throw err;
                    if(isMatch){
                        return done(null,user);
                    } else {
                        return done(null,false,{message:'Password Incorrect'});
                    }
                });
            })
            .catch(err => console.log(err));
    })
)    
passport.serializeUser(function(user,done){
    done(null,user.id);
});    
passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});    

app.post("/login", function(req, res,next){
    passport.authenticate('local',{
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    })(req,res,next);
});


//Home route
app.get('/home',ensureAuthenticated,(req,res)=>{
    name = req.user.fname+' '+req.user.lname;
    res.render('home',{name:name});
});

// Forgot Password Route
app.get('/forgot',(req,res)=>{
    res.render('forgot');
});

// Forgot Password Handle
app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 600000; // 10 min
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'codewithash99@gmail.com',
             pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'codewithash99@gmail.com',
          subject: 'Redpositive Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/forgot');
    });
  });

// Reset Password Route
app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
});
  
app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }
          if(req.body.password === req.body.confirm) {
            bcrypt.genSalt(10,(err,salt)=>bcrypt.hash(req.body.password,salt,(err,hash)=>{
                if(err) throw err;
                //set password to hash
                user.password = hash;
                user.save(function(err) {
                    req.logIn(user, function(err) {
                      done(err, user);
                    });
                  });
            }))
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('back');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'codewithash99@gmail.com',
             pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'codewithash99@mail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success_msg', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/login');
    });
  });

// Logout Handle
app.get('/logout',(req,res)=>{
    req.logOut();
    req.flash('success_msg','You are logged out');
    res.redirect('/login');
});

// Configuring routes
app.use("/meeting",meetingRoutes);
app.use("/webinar",webinarRoutes);
app.use("/classroom",classroomRoutes);


app.listen(5000,function(){
    console.log("The Server is running at port 5000");
});