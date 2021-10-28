const express = require('express');
const router = express.Router();
const SingUpTemplatedb = require('../models/singupmodel');
const cors = require('cors')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



let refreshTokens = ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRkQGRyLmpqIiwicGFzc3dvcmQiOiIkMmIkMTAkVUFveEx0b3E4c25XRzBWdVZDMGpILnRiTHlTeWMubE8yTXpscFo1cDFJR1RWTkhvcUpUQm0iLCJpYXQiOjE2MzQ4OTgwOTl9.hD6spSiXfqeKUzMgsAV58umyYySE9p6owBF3biWG_8E"]
router.post('/token', (req, res) => {
  const refreshToken = req.body.oldToken
  if(refreshToken == null) return res.sendStatus(401);
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if(!user.refreshToken == refreshToken) return res.sendStatus(403);
    if(err) return res.sendStatus(403);
    const accessToken = jwt.sign({email:user.email, password:user.password}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '8s'})
    res.json({accessToken,})
  })
})

router.delete('/logout', (req, res)=> {
  // refreshTokens = refreshTokens.filter(token => token !== req.body.token);
  // res.sendStatus(204)
})

function authenticationToken(req, res, next){
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[0];
  if(token == null) return res.sendStatus(401);
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user)=>{
    if(err) return res.sendStatus(403)
    req.user = user;
    next()
  })
}

router.get('/post',authenticationToken, (req, res) =>{
  res.status(200).json({user:req.user});
})


router.post("/singup", cors(), async (request, response) => {

  SingUpTemplatedb.findOne({email: request.body.email}, async function (err, myUser) {
    if(myUser == null){
      const saltPassword = await bcrypt.genSalt(10);
      const securedPassword = await bcrypt.hash(request.body.password, saltPassword)
      request.body.password = securedPassword;
      
      try {
        const accessToken = jwt.sign({email:request.body.email, password:request.body.password}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '8s'})
        const refreshToken = jwt.sign({email:request.body.email, password:request.body.password}, process.env.REFRESH_TOKEN_SECRET)
        
        let forDatabase = {...request.body, refreshToken}

        const user = new SingUpTemplatedb(forDatabase);
        await user.save();
        response.json({accessToken, refreshToken});


      } catch (error) {
        response.status(500).send(error);
      }

    }else{
      response.status(500).send(err);
    }
  })
});


router.post("/login", cors(), async (request, response) => {

  SingUpTemplatedb.findOne({email: request.body.email}).exec(async function (err, myUser) {
      if(myUser != null){
        const ispassword = await bcrypt.compare(request.body.password, myUser.password)
        if(ispassword && myUser.active == true){
          try {
          const accessToken = jwt.sign({email:request.body.email, password:request.body.password}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '8s'})
          response.json({accessToken,refreshToken:myUser.refreshToken});
          } catch (error) {
            response.status(500).send(error);
          }
        }else{
          response.status(500).send(err);
        }
      }else{
        response.status(500).send(err);
      }
  })
});


module.exports = router;
