var mongoose = require("mongoose");
var webinarSchema = new mongoose.Schema({
    webinarName : {type: String, unique: false, required: true},
    webinarId : {type: String, unique: true , required: true},
    webinarCode : {type: String, unique: false , required: true},
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
    webinarUsers: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "WebinarUser"
        }
    ]
});
module.exports = mongoose.model("Webinar", webinarSchema);