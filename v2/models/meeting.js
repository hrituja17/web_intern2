var mongoose = require("mongoose");
var meetingSchema = new mongoose.Schema({
    meetingName : {type: String, unique: false, required: true},
    meetingId : {type: String, unique: true , required: true},
    meetingCode : {type: String, unique: false , required: true},
    hostTime : {
        type: Date
    },
    hostDate : {
        type: Date
    },
    host: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        email : {type: String , unique:false , required: true}
    },
    meetingUsers: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "MeetingUser"
        }
    ]
});
module.exports = mongoose.model("Meeting", meetingSchema);