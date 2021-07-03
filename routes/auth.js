const jwt = require('jsonwebtoken')
module.exports.checkAuth = (req ,res , next) => { 
        let authHeader = req.headers.authorization
        let token = authHeader.split(' ')[1]
        console.log('authHeader', authHeader)
        console.log('token :', token)
        if (token == null) return res.status(401).send('Not auth')
        try {
                let decoded = jwt.verify(token, process.env.SECRET_KEY);
                console.log(decoded)
                next()
            } 
        catch(err) {
                res.status(403).send(err)
        }
    }
    
