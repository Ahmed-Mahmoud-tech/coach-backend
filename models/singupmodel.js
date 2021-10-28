const mongoose = require('mongoose');
const SingUpTemplate = new mongoose.Schema({
    fullName:{
        type:String,
    },
    email:{
        type:String,
        required:true,
        unique: true
    },
    password:{
        type:String,
        required:true
    },
    userType:{
        type:Number,
        required:true
    },
    refreshToken:{
        type:String,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    },
    active:{
        type:Boolean,
        default:true
    }
})

module.exports = mongoose.model('user', SingUpTemplate)