const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const path = require('path')
const app = express()
const cookieParser = require('cookie-parser')
const FacebookStrategy = require('passport-facebook').Strategy
const passport = require('passport')

const userRoute = require('./routes/userRoute')
const questionRoute = require('./routes/questionRoute')
require('dotenv').config()

app.use(cors())
app.use(express.json()) 
app.use(cookieParser())


// routes
app.use('/', userRoute)
app.use('/', questionRoute)
app.get('/express', (req, res)=> { 
<<<<<<< HEAD
  // Not Working 
  res.redirect('https://www.youtube.com/watch?v=4wnjn8XB1xE&t=787s')
=======
  res.redirect('https://facebook.com')
>>>>>>> fblogin
})

app.use((req, res, next)=>{
  res.header('Access-Control-Allow-Origin', '*')
  res.header
      ('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, text/html')
  if(req.method === 'OPTIONS'){
      res.header('Access-Control-Allow-Origin', 'PUT, POST, GET, PATCH, DELETE')
      return res.status(200).json({})
  }
  next()
}) 


<<<<<<< HEAD
// facebook login [ not working due to Cors issue ]
passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID_FB,
    clientSecret: process.env.CLIENT_SECRET_FB,
    callbackURL: "http://localhost:8000/auth/facebook/secret"
  },

  (accessToken, refreshToken, profile, cb)=>{
    User.findOrCreate({ facebookId: profile.id },  (err, user)=> {
      return cb(err, user);
    });
    // console.log('profile', profile)
    // console.log('accessToken', accessToken)
    // console.log('refreshToken', refreshToken)

    // check if user exist 
  }
));
app.get('/auth/facebook', passport.authenticate('facebook') ,(req, res)=> { 
  console.log('Facebook Auth')
});
 
app.get('/auth/facebook/secret',passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
})

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
 
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
=======
>>>>>>> fblogin














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

// deploy to heroku
// serve static assets if in production 
if (process.env.NODE_ENV === 'production'){
    //set static folder
    app.use(express.static('../frontend-jwt/build'))

    app.get('*', (req, res)=>{
        res.sendFile(path.resolve(__dirname, '../frontend-jwt', 'build', 'index.html'))
    })
}


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