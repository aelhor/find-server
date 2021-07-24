const mongoose = require('mongoose')
const {Schema} = mongoose
const userSchema = new Schema({
    email:   
        {
            type : String, 
            required: true, 
            unique : true , 
            match :/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        }, 
    password : 
        { 
            type : String, 
            required: true, 
            minlength : 8,
        }, 
    userName : 
        {
            type : String,
            required: true,
            unique : true ,  
        },
    following : Array,
    followers : Array,    
}, {timestamps :true} )

const user = mongoose.model('User', userSchema);
module.exports = user