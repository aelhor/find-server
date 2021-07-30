const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const app = express()
const cookieParser = require('cookie-parser')
const userRoute = require('./routes/userRoute')
const questionRoute = require('./routes/questionRoute')

require('dotenv').config()

app.use(cors())
app.use(express.json()) 
app.use(cookieParser())


// routes
app.use('/', userRoute)
app.use('/', questionRoute)


// Handle Not Found Routes 
app.use((req, res, next)=> { 
    const error = new Error(`${req.originalUrl} Page Not Found... `)
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


// db connection 
mongoose.connect(
    process.env.MONGO_URI,
    {
        useNewUrlParser : true,
        useUnifiedTopology: true  
    }, 
    ()=> console.log('db connected')
)

app.listen( process.env.PORT, ()=>  console.log(`server on ${ process.env.PORT}`) )