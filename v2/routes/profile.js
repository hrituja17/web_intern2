var User = require("../models/user");
var express = require("express");
var router  = express.Router();
var multer = require("multer");
var path = require("path");
var flash = require('connect-flash');

//ensure Authentication
var {ensureAuthenticated} = require('../middleware/auth');

router.use(flash());

// Profile picture upload

// Set Storage Engine
const storage = multer.diskStorage({
    destination: './public/profilepic/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize Upload 
const upload = multer({
    storage: storage,
    limits: {fileSize : 10000000000}, //(in bytes)
    fileFilter: function(req, file, cb){
        checkFileType(file, cb);
    }
}).single('uploadImage');


// Check file type
function checkFileType(file, cb){
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}



router.get("/:id", ensureAuthenticated, (req, res) => res.render("profile", { user: req.user }));


// PROFILE PICTURE ROUTE

router.post('/:id', ensureAuthenticated, (req, res) => {
    upload(req, res, (err) => {
        if(err) {
            console.log('Failed to upload!');
            res.render('profile', { msg: err, user: req.user });
        } else {
            if(req.file == undefined){
                res.render('profile', { msg: 'No image selected!', user: req.user });
            } else {
                User.findOneAndUpdate({ email: req.user.email}, { userImage: req.file.filename })
                    .then(user => {
                        if(user) {
                            res.render('profile', { 'success_msg': 'Profile picture updated! Refresh the page to see changes', user: req.user, file: `profilepic/${req.file.filename}`});
                        }
                    })
                    .catch(err => {
                        console.log(err);
                        res.render('profile', { 'error_msg': 'Upload failed!', user: req.user });
                    });
            } 
        }
    });
});



// PROFILE EDIT ROUTE

router.get('/:id/edit', ensureAuthenticated, (req, res) => {
    res.render("editprofile", { user: req.user });
});

router.put('/:id', ensureAuthenticated, (req, res) => {
    const editedProfile = {fname: req.body.fname, lname: req.body.lname, contact: req.body.contact, gender: req.body.gender };
    User.findByIdAndUpdate(req.params.id, editedProfile, (err, updatedUser) => {
        if(err){
            console.log(err);
            res.redirect('back');
        } else {
            req.flash('success_msg','Details updated!');
            res.redirect('/profile/' + req.params.id);
        }
    });
});


module.exports = router;