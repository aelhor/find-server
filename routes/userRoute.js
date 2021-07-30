const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const { checkAuth } = require('./auth')
const maxAge = 4 * 1000 *60 *60 * 24
require('dotenv').config('../.env')
const fetch = require('node-fetch');

router.post('/signup',async (req, res)=> { 
    const {email, password, userName} = req.body
    // CHECK is the user already exist
    try{
        const signinUser = await User.findOne({email : email})
        if (signinUser) { 
            return res.status(409).send('User Name or Email already exist')
        }   
        else { 
            // hash the passworrd 
            bcrypt.hash(password, 10, async(error, hash)=> { 
                if (error) { 
                    return res.status(500).send(error.message)
                }
                else {
                    try{
                        const signupToken =  jwt.sign({email :email}, process.env.SECRET_KEY, {expiresIn : maxAge})
                        // create the new user 
                        const newUser =  new User({
                            email : email, 
                            userName : userName,
                            password : hash, 
                            fbPicture : 'none'
                        })
                        const saveduser = await newUser.save()
                        res.cookie('jwt', signupToken ,{maxAge : maxAge})
                        return res.status(200).json({
                            message : 'User Created', 
                            newUser : {
                                id : newUser._id ,
                                userName : newUser.userName ,
                                email : newUser.email,
                                signupToken :signupToken
                            },
                        })
                    }
                    catch(error) { 
                        res.status(409).send(error) // 
                    }
                }
            })
        }
    }
    catch(error){
        res.status(503).send(error.message)
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
                            fbPicture : picture.data.url
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
router.get('/users/:userId', checkAuth, async(req, res)=>{ 
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
        res.status(500).send(error.message)    
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

// send friend request 
router.post('/users/sendfriendreq/:userId', async(req, res)=> { 
    const reqSenderId = req.body.reqSenderId
    const userId = req.params.userId 
    try {
        const friendsList = await User.updateOne( {_id : userId },
            { $addToSet : // add the item if it doesn't exist 
                {
                    friendRequests : reqSenderId
                } 
            }
             )
        res.status(200).json({
            message : 'Friend Reqest sent',
            user : friendsList
        })
        
    } catch (error) {
        res.status(500).send(error.message)
    }
})

// cancle friend request 
router.post('/users/canclefriendreq/:userId', async(req, res)=>  {
    const reqSenderId = req.body.reqSenderId
    const userId = req.params.userId 
    
    try {
        const friendsList = await User.updateOne( {_id : userId },
            { $pull : // add the item if it doesn't exist 
                {
                    friendRequests : reqSenderId
                } 
            }
             )
        res.status(200).json({
            message : 'Frieng Reqest cancled',
            user : friendsList
        })
        
    } catch (error) {
        res.status(500).send(error.message)
    }
})

// accept friend request 
router.post('/users/addfriend/:userId', async(req, res)=> { 
    const userId = req.params.userId
    const friendId = req.body.friendId
    try {
        // add friendId to friends list 
        const friendsList = await User.updateOne( {_id : userId },
            { $addToSet : // add the item if it doesn't exist 
                {
                    friends : friendId
                } 
            }
             )
        // delete friendId from friendRequests list 
        const friendRequestsList = await User.updateOne( {_id : userId },
            { $pull : // add the item if it doesn't exist 
                {
                    friendRequests : friendId
                } 
            }
             )
            
        res.status(200).json({
            message : 'Frind added & deleted from requests list',
            user : friendsList,
            friendRequestsList :friendRequestsList
        })
    } 
    catch (error) {
        res.status(500).send(error.message)
    }
})
// unfriend 
router.post('/users/unfriend/:userId', async(req, res)=>{ 
    const userId = req.params.userId
    const friendId = req.body.friendId
    try {
        const friendsList = await User.updateOne( {_id : userId },
            { $pull :  
                {
                    friends : friendId
                } 
            }
             )
        res.status(200).json({
            message : 'Frind Deleted',
            user : friendsList
        })
    } 
    catch (error) {
        res.status(500).send(error.message)
    }  
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

