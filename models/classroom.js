var mongoose = require("mongoose");
var classroomSchema = new mongoose.Schema({
    classroomName : {type: String, unique: false, required: true},
    classroomId : {type: String, unique: true , required: true},
    classroomCode : {type: String, unique: false , required: true},
    hostTime : {
        type: Date
    },
    hostDate: {
        type: Date
    },
    host: {
        id: {
           type: mongoose.Schema.Types.ObjectId,
           ref: "User"
        },
        email : {type: String , unique:false , required: true}
    },
    classroomUsers: [
        {
           type: mongoose.Schema.Types.ObjectId,
           ref: "ClassroomUser"
        }
    ]
});
module.exports = mongoose.model("Classroom", classroomSchema);