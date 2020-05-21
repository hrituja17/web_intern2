var mongoose = require("mongoose");
var meetingUserSchema = new mongoose.Schema({
    meetingId: {    
           type: mongoose.Schema.Types.ObjectId,
           ref: "Meeting"    
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
module.exports = mongoose.model("MeetingUser", meetingUserSchema);