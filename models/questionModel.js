const mongoose = require('mongoose')
const {Schema} = mongoose
const questionScema = new Schema({
    body : 
    {
        type : String, 
        required : true, 
        maxlength : 300
    }, 
    answer :
    { 
        type : String , 
        maxlength : 300,
        default  : ''
    }, 
    askedTo : { 
        type : String, 
        required : true
    },
    likes : Number

},{timestamps : true})

const Ques = mongoose.model('Questions ', questionScema);
module.exports = Ques