var mongoose = require("mongoose");
var webinarUserSchema = new mongoose.Schema({
    webinarId: {    
           type: mongoose.Schema.Types.ObjectId,
           ref: "Webinar"    
    },
    userId: {    
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"    
    },
    isAdmin: {
        type: Boolean, 
        default: false
    },
    joiningTime: {
        type: Date,
        default : Date.now 
    }
});
module.exports = mongoose.model("WebinarUser", webinarUserSchema);