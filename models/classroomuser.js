var mongoose = require("mongoose");
var classroomUserSchema = new mongoose.Schema({
    classroomId: {    
           type: mongoose.Schema.Types.ObjectId,
           ref: "Classroom"    
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
        default: Date.now
    }
});
module.exports = mongoose.model("ClassroomUser", classroomUserSchema);