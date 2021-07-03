const express = require('express')
const router = express.Router()
const Ques = require('../models/questionModel')
const User = require('../models/userModel')
require('dotenv').config('../.env')
const { checkAuth } = require('./auth')
// let checkAuth = (req ,res , next) => { 
//     let authHeader = req.headers['authorization']
//     token = authHeader && authHeader.split(' ')[1]
//     console.log('authHeader', authHeader)
//     if (token == null) return res.status(401)
//     try {
//             let decoded = jwt.verify(token, process.env.SECRET_KEY);
//             console.log(decoded)
//             next()
//         } 
//     catch(err) {
//             res.status(403).send(err)
//     }
    
// }

// get all the ques for a specific user 
router.get('/questions/:userID' ,checkAuth ,async(req, res)=> { 
    const userId = req.params.userID 
    try{
         // check if the userId is exsit 
        const user = await User.findOne({_id : userId})
        if (user){
            try{
                const questions = (await Ques.find()).filter(qu=> qu.askedTo === userId)
                res.status(200).json(questions)
            }
            catch(error){ 
                res.status(500).send(error)
            }
        }
        else{
            res.status(409).send('user not found')
        }
    }
    catch(error){
        res.status(500).send(error)
    }
    
})

// get a specific question
router.get('/question/:quesId', checkAuth, async(req, res)=>{ 
    const quesId = req.params.quesId
    try {
        const ques = await Ques.findOne({_id : quesId})
        res.status(200).json({ques : ques})
    } catch (error) {
        res.status(500).send(error.message)
    }
})

// ask a question to specific user 
router.post('/questions/ask/:userId',checkAuth, async(req, res)=>{ 
    const {body} = req.body 
    const userId = req.params.userId
    if (body){
        try {
            // check if the user exsits 
            const user = await User.findOne({_id : userId})
            if (user) { 
                try{ 
                    const newQues =  new Ques({
                        body : body,
                        askedTo : userId, 
                    })
                    newQues.save()
                    res.status(200).json({
                        message : 'Question Sent', 
                        question : newQues 
                    })
                }
                catch(error){
                    res.status(500).send(error.message)
                }
            }
            else { 
                res.status(500).send('User Not Found')
            }
        } 
        catch (error) {
            res.status(500).send(error)
    
        }
    }
    else{
        return res.status(500).send('Question body is required...')
    }
    
})

// answer a question 
router.patch('/questions/answer/:quesId',checkAuth , async(req, res)=> { 
    const quesId = req.params.quesId
    const {answer} = req.body
    try {
        const updated = await Ques.update({_id : quesId}, { $set: { answer : answer } }) 
        res.status(200).json({
            message :  'Answerd sent ', 
            answer : answer 
        })
    } 
    catch (error) {
        res.status(500).send(error)
    }
})

// Like a question 
router.patch('/questions/like/:quesId',checkAuth , async(req,res)=>{
    const activeUserId = req.body.activeUserId
    const activeUserName= req.body.activeUserName
    try {
        const likedQues = await Ques.updateOne({_id : req.params.quesId}, {
            $addToSet: {
                likes :{userId: activeUserId, userName : activeUserName }
            }
        }) 
        res.status(200).json({
            message : `You Liked The Question`, 
            likedQues : likedQues
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
})
// disLike a question 
router.patch('/questions/dislike/:quesId',checkAuth , async(req,res)=>{
    const activeUserId = req.body.activeUserId
    const activeUserName= req.body.activeUserName
    try {
        const likedQues = await Ques.updateOne({_id : req.params.quesId}, {
            $pull: {
                likes :{userId: activeUserId, userName : activeUserName }
            }
        })
        res.status(200).json({
            message : `You disLiked The Question`, 
            likedQues : likedQues
        })
    } catch (error) {
        res.status(500).send(error.message)
    }
})

router.delete('/questions/delete/:id',checkAuth , async(req, res)=> { 
    const quesId = req.params.id
    try {
        const deletedQues = await Ques.findOneAndDelete({_id : quesId })
        res.status(200).json({
            message : 'Question Deleted', 
            deletedQuestion : deletedQues
        })
    } 
    catch (error) {
        res.status(500).send(error.message)

    }
})



router.get('/protectedRoute', checkAuth, (req, res)=> { 
    res.send('Protected Route')
})

module.exports = router