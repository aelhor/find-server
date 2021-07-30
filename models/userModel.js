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
    fbPicture : {
        type : String , 
        default : 'https://www.google.com.eg/url?sa=i&url=https%3A%2F%2Ficon-icons.com%2Ficon%2Favatar-default-user%2F92824&psig=AOvVaw1F_Zc2egWFixPcFvKWPSNj&ust=1627736164292000&source=images&cd=vfe&ved=0CAsQjRxqFwoTCIi0pfHrivICFQAAAAAdAAAAABAO'
    },
    following : Array,
    followers : Array,    
}, {timestamps :true} )

const user = mongoose.model('User', userSchema);
module.exports = user