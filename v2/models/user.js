var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    fname: {type: String},
    lname: {type: String},
    email: {type: String, unique: true , required:true},
    password: {type: String},
    date:{type : Date, default : Date.now },
    userImage: {
        type: String,
        required: false
    },
    contact: {
        type: String,
        required: false
    },
    gender: {
        type: String,
        required: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

UserSchema.plugin(passportLocalMongoose , {usernameField : "email"});

module.exports = mongoose.model("User", UserSchema);