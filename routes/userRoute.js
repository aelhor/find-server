const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const { checkAuth } = require('./auth')
const maxAge = 4 * 1000 *60 *60 * 24
require('dotenv').config('../.env')
const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: process.env.MAILGUN_API_KEY , domain: process.env.MAILGUN_DOMAIN});
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const multer  = require('multer')
const storage = multer.diskStorage({
    destination:  (req, file, cb)=> {
      cb(null, './profilePics')
    },
    filename:  (req, file, cb)=> {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '_' + file.originalname)
    }
  })
  
const upload = multer({ storage: storage })


router.post('/signup',upload.single('profilePic') , async (req, res)=> { 
    const {email, password, userName} = req.body
    console.log(req.file)
    // CHECK is the user already exist 
    try{
        const signinUser = await User.findOne({email : email})
        if (signinUser) { 
            return res.status(409).send('User already exist')
        }   
        else { 
            try{
                const hash =  await bcrypt.hash(password, 10)
                // create the new user verified = false
                const newUser =  new User({
                    email : email, 
                    userName : userName,
                    password : hash, 
                    fbPicture : 'none',
                    profilePic : req.file.path
                })
                await newUser.save() 
                const token =   jwt.sign({ email: email }, process.env.SECRET_KEY)
                
                const msg = {
                    to: email,
                    from: 'arayes017@gmail.com', // Use the email address or domain you verified above
                    subject: 'Email verify',
                    text: 'Verify your Find email',
                    html: `
                        <button> <a href='http://localhost:8000/emailverify?verifyToken=${token}'> Verify your email </a> </button?
                    `,
                  };
                try {
                    await sgMail.send(msg);
                    return res.status(200).json({
                        msg : `email sent to ${email} please confirm your email`,
                        userName : newUser.userName , 
                        id : newUser._id,
                        token : token
                    })
                } 
                catch (error) {
                    console.error(error);
                    if (error.response) {
                        console.error(error.response.body)
                    }
                }
            }
            catch(error) { 
                res.status(409).send(error) // 
            }        
        }
    }
    catch(error){
        res.status(503).send(error.message)
    }
})
router.get('/resendemail', async(req, res)=>{
    const {email} = req.query;
    const token =  jwt.sign({ email: email }, process.env.SECRET_KEY)
   
    const msg = {
        to: email,
        from: 'arayes017@gmail.com', // Use the email address or domain you verified above
        subject: 'Email verify',
        text: 'Please click the button below to verify your Find email',
        html: `
            <button> <a href='http://localhost:8000/emailverify?verifyToken=${token}'> Verify your email </a> </button>
        `,
      };
    try {
        await sgMail.send(msg);
        console.log(email)
        return res.status(200).send( `email resent to ${email}`)
    } 
    catch (error) {
        console.error(error);
        if (error.response) {
            console.error('Error : ',error.response.body)
        }
    }

})

router.get('/emailverify', async(req, res)=> { 
    const {verifyToken} = req.query 
    try {
        let decoded = jwt.verify(verifyToken, process.env.SECRET_KEY);
        await User.findOneAndUpdate({email : decoded.email}, {$set :{ verified : true}}, {new : true} )
        // res.json({
        //     msg : 'email verified successfully', 
        // })
        res.redirect(process.env.DEV_CLIENT_URL)
    } catch (error) {
        res.send(error)
    }
})

// log in 
router.post('/login', async(req, res)=>{
    const {email, password} = req.body
    try{
        // check if the user email is exist
        const user = await User.findOne({ email : email })
        if (user){
            // verify the password 
            bcrypt.compare(password, user.password, (error, result)=>{ 
                if (error){
                    return res.status(422).send(error)
                }
                if (result){
                    // password is correct 
                    const token = jwt.sign({email : user.email}, process.env.SECRET_KEY, {expiresIn : maxAge })
                    // res.cookie('jwt', token ,{httpOnly : true, maxAge : maxAge}) // not working 
                    return res.status(200).json({
                        userName : user.userName , 
                        id : user._id,
                        token : token
                    })
                }
                return res.status(403).send('Invalid password ')
            })
        }
        else{
            return res.status(404).send('User Not Found')
        }
    }
    catch(err){
        res.status(404).send(err)
    }
})

// Facebook Login 
router.post('/facebookLogin', async(req, res)=>{ 
    const {accessToken, userID, email, name ,picture} = req.body
    console.log(picture)
    try {
        const fbUser = await User.findOne({email : email})
        if (fbUser) { 
            // log him in 
            try{
                const token = jwt.sign({email : email}, process.env.SECRET_KEY, {expiresIn : maxAge })
                // res.cookie('jwt', token ,{httpOnly : true, maxAge : maxAge}) // not working 
                return res.status(200).json({
                    msg : 'fb user already exists ', 
                    newUser : {
                        id : fbUser._id , // wrong 
                        userName : name ,
                        fbPicture : fbUser.picture , /// remember :  delete this line  
                        signupToken :token
                    },
                })  

            }
            catch(error){
                console.log(error)
            }
        }
        else{ 
            //create a new user  
            try{
                const signupToken =  jwt.sign({email :email}, process.env.SECRET_KEY, {expiresIn : maxAge})
                bcrypt.hash(email + process.env.SECRET_KEY, 10 , async(err, hash)=> { 
                    if (err){
                        return res.status(500).send(err.message)
                    }
                    else { 
                        // create the new user 
                        const newUser =  new User({
                            email : email, 
                            userName : name,
                            password : hash, 
                            fbPicture : picture.data.url, 
                            verified : true
                        })
                        console.log('3',picture.data)
                        const saveduser = await newUser.save()
                        return res.status(200).json({
                            message : 'fb User is Created', 
                            newUser : {
                                id : newUser._id ,
                                userName : newUser.userName ,
                                fbPicture : newUser.picture , /// remember :  delete this line  
                                signupToken :signupToken
                            },                        
                        })
                    }
                })
                
            }
            catch(error) { 
                res.status(409).send(error) // 
            }
        }
    } catch (error) {
        console.log(error)
    } 

})

// get a specific user's data 
router.get('/users/:userId', async(req, res)=>{ 
    const id = req.params.userId
    try {
        const user = await User.findOne({_id : id})
        if (user){
            res.status(200).json({user : user})
        }
        else{
            res.status(200).send('User Not Found')
        }
    } 
    catch (error) {
        res.status(500).send(error)    
    }
}) 

// check if the user in the db & if the client enter a correct pass to delete it's account 
const checkInfoBeforeDelete = (req, res, next)=> { 
    const {password} = req.body
    const {userId} = req.params
    try {
        
        if (password === '1234'){
            // compare passwords 
            next()
        }
    } 
    catch (error) {
        res.status(500).send(error.message)
    }
}
//[not completed]
// delete a user  [ should be protected & should check if that client own thet account ]
router.delete('/users/:userId' ,checkAuth, async(req, res)=> { 
    const userId = req.params.userId
    const {password} = req.body
    try{
        // check if the user _id exist
        const user = await User.findOne({ _id : userId })
        if (user){
            // verify the password 
            bcrypt.compare(password, user.password, async(error, result)=>{ 
                if (error){
                    return res.status(500).send(error.message)
                }
                if (result){
                    // password is correct => so delete the user
                    try { 
                        const deletedUser = await User.findOneAndDelete({_id : userId})
                            // user successfully deleted 
                            res.status(200).json({ 
                                message : 'User Successfully Deleted',
                                deleted : deletedUser
                            })
                    }
                    catch(error) { 
                        res.status(500).send(error.message)
                    }
                }
                return res.status(200).send('Invalid password ')
            })
        }
        else{
            return res.status(200).send('User Not Found  ')
        }
    }
    catch(err){
        res.status(500).send(err.message)
    }
})

// follow a spacific user 
router.post('/users/follow/:activeUserId', checkAuth, async(req, res)=>{ 
    const userId = req.params.activeUserId
    const targetUserId = req.body.targetId // targetUser : the one u want to follow
    const targetUserName = req.body.targetUserName
    const activeUserName = req.body.activeUserName
    if (targetUserId){
        try {
            // add the targetUserId to active User following list
            const following = await User.updateOne({_id : userId},
                { $addToSet : // add the item if it doesn't exist 
                    {
                        following : {userId : targetUserId, userName:targetUserName}// following refere to ppl u follow
                    } 
                } )

            //add active user's Id to target user's followers list
            const followers = await User.updateOne({_id : targetUserId},
                { $addToSet : // add the item if it doesn't exist 
                    {
                        followers: {userId: userId, userName : activeUserName }// following refere to ppl u follow
                    } 
                } )

            res.status(200).json({
                message : `you Followed ${targetUserId}`,
                following : following, 
                followers : followers
            })
        } catch (error) {
            res.status(500).send(error.message)   
        }
    }
    else{
        res.status(500).send('Enter a target_User_Id')    
    }
})

//unFollow
router.post('/users/unfollow/:activeUserId', checkAuth, async(req, res)=>{ 
    const userId = req.params.activeUserId
    const targetUserId = req.body.targetId // targetUser : the one u want to follow
    const targetUserName = req.body.targetUserName
    const activeUserName = req.body.activeUserName
    if (targetUserId){
        try {
            // delete the targetUserId from active User following list
            const following = await User.updateOne({_id : userId},
                { $pull :  
                    {
                        following : {userId : targetUserId, userName:targetUserName} // following refere to ppl u follow
                    } 
                } )
            //delete active user's Id to target user's followers list
            const followers = await User.updateOne({_id : targetUserId},
                { $pull : 
                    {
                        followers: {userId: userId, userName : activeUserName } // following refere to ppl u follow
                    } 
                } )
            res.status(200).json({
                message : `you un Followed ${targetUserId}`,
                following : following, 
                followers : followers
            })
        } catch (error) {
            res.status(500).send(error.message)   
        }
    }
    else{
        res.status(500).send('Enter a target_User_Id')    
    }
})

const escapeRegex = (text)=> {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
// search for a user 
router.get('/search' , async(req, res)=> { 
    const q = req.query.q
    console.log('q = ', q)
    if (!q) 
        return res.status(400).send({})
    try {        
        const result =await User.aggregate([
            {
              $search: {
                "text": {
                  "path": "userName",
                  "query": q,
                  "fuzzy": {
                    "maxEdits": 1,
                    "maxExpansions": 100,
                    "prefixLength" :1
                  }
                }
              }
            },
            {
              $limit: 10
            },
            {
                $project: {
                  "_id": 1,
                  "userName": 1,
                  'fbPicture' : 1,
                }
            }
        ])
        res.status(200).send(result)
    }    
    catch(error) {
        res.status(500).send(error)
    }
})

router.get('/test', (req, res)=> { 
    res.status(200).send('Ya ^_^' )
})
// development route
router.get('/users', async(req, res)=> { 
    try { 
        const users = await User.find()
        res.status(200).json({
            count : users.length,
            users : users,
        })
    }    
    catch(error) {
        res.status(500).send(error.message)
     }
})


module.exports = router

  