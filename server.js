const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const app = express()

const userRoute = require('./routes/userRoute')
const questionRoute = require('./routes/questionRoute')
require('dotenv').config()

app.use(cors())
app.use(express.json()) 

// routes
app.use('/', userRoute)
app.use('/', questionRoute)

// Handle Not Found Routes 
app.use((req, res, next)=> { 
    const error = new Error(`Not Found Babe ${req.originalUrl}`)
    res.status(404)
    next(error)
})

app.use((error, req, res, next)=> { 
    //check if the status is still 200 means that other routh threw that err so we will make it 500 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode  
    res.status (statusCode)
    res.json({ 
        message : error.message, 
        // stack :process.env.NODE_ENV === 'PRODUCTION ' ? 'Babe, hi': error.stack // hlpful for debuging tellingg u where the err is   
        }
    )}
)

// deploy 
// serve static assets if in production 
if (process.env.NODE_ENV === 'production'){
    //set static folder
    app.use(express.static('../frontend-jwt/build'))

    app.get('*', (req, res)=>{
        res.sendFile(path.resolve(__dirname, 'frontend-jwt', 'build', 'index.html'))
    })

}
// console.log(path.dirname(__dirname)); // f:/jwt
// db connection 
mongoose.connect(
    process.env.DB_URL,
    {
        useNewUrlParser : true,
        useUnifiedTopology: true  
    }, 
    ()=> console.log('db connected')
)
const port = process.env.PORT

app.listen(port, ()=> {
    console.log(`server on ${port}`)
})