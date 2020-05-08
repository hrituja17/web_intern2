var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    fname: {type: String, unique: false, required: true},
    lname: {type: String, unique: false, required: true},
    email: {type: String, unique: true, required: true},
    password: {type: String},
    date:{type : Date, default : Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});

UserSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", UserSchema);