const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Ques = require('../models/questionModel')
const User = require('../models/userModel')
require('dotenv').config('../.env')


const checkAuth =  (req ,res , next) => { 
    try{
        // console.log(req.headers);
        // const token = req.headers.authorization.split(' ')[1]
        const token = req.query.token
        console.log('token : ',token ) // 

        const decoded =  jwt.verify(token, process.env.SECRET_KEY)

        console.log('Decoded : ', decoded) // 
        
        next()
    }
    catch(error){ 
        res.status(500).send(error)
    }
}

// get all the ques for a specific user 
router.get('/questions/:userID' ,async(req, res)=> { 
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
                res.status(500).send(error.message)
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

// ask a question to specific user 
router.post('/questions/ask/:userId', async(req, res)=>{ 
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
                        askedTo : userId  // ?
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
router.patch('/questions/answer/:quesId', async(req, res)=> { 
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
router.post('/question/like/:quesId', async(req,res)=>{
    try {
        const likedQues = await Ques.updateOne({_id : req.params.quesId}, {
            likes : + 1
        })
          
        res.status(200).send(`You Like The Question ${likes} on it `)


    } catch (error) {
        res.status(500).send(error.message)
    }
})

// delete question =>[not completed] just the user sent the question should be able to delete it 

router.delete('/questions/delete/:id', async(req, res)=> { 
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