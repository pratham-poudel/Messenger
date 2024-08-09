const express = require('express');
const router = express.Router();
const userModel = require('./user');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();










const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.user,
      pass: process.env.pass,
    },
  });
  
  // Define a function to send email
  async function sendEmail(to, subject, html) {
  
    try {
      // Compose the email
      const mailOptions = {
        from: 'ppoudel_be23@thapar.edu',
        to: to,
        subject: subject,
        html: html,
  
      };
  
      // Send the email
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  










router.get('/', (req, res) => {
    res.render('warning');
});
router.get('/welcome', (req, res) => {
  res.render('welcome');
});
router.get('/login', (req, res) => {
    res.render('login');
});
router.get('/signup', (req, res) => {
    res.render('signup');
});
router.get('/chat',isLoggedin,async (req, res) => {
  email= req.user;
  user = await userModel.findOne({email: email});
  console.log(user);
    res.render('chat',{fullname: user.fullName, email: user.email,branch: user.branch});
});
router.post('/login', async function(req, res, next) {
  
    let user = await userModel.findOne({email: req.body.email});
    if (!user) {
      res.send("User not found");
      return;
    }else if(user.password !== req.body.password){
      res.send("Email or Password is incorrect");
    }else if(user.password === req.body.password){
      let token = jwt.sign(req.body.email,process.env.TOKEN)
      res.cookie("token",token)
      res.redirect('/profile');
      
    }
    
  
  })
  router.post('/signup', async function(req, res, next) {
    try {
      let user = await userModel.findOne({email: req.body.email});
      if(!user){
        let createdUser = await userModel.create({
          universityRollNo: req.body.rollNumber,
          branch: req.body.branch,
          fullName: req.body.name,
          email: req.body.email,
          phoneNumber: req.body.phoneNumber,
          password: req.body.password
        });
        const token = jwt.sign(req.body.email,process.env.TOKEN)
        res.cookie("token",token)
        res.redirect('/verifyemail');
      }else{
        res.send("User already exists");
      }
    } catch (error) {
      res.send(error.message);
    }
    
    
   
  })
  function isLoggedin(req,res,next){
    let token =  req.cookies.token;
   if(!token){
     res.redirect("/login")
  }else if (token){
    let data = jwt.verify(token,process.env.TOKEN);
    req.user = data;
    next();
  }
  }
  router.get('/logout', function(req, res, next) {
    res.cookie("token","")
    res.render('welcome');
   
  });
  
  router.get('/verifyemail', isLoggedin , async function(req,res){
    let email= req.user;
    let otp = Math.floor(10000 + Math.random() * 90000);
    await sendEmail(email, 'Otp for Thaparmegle  Verification', `<html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                border: 1px solid #ccc;
                border-radius: 5px;
                background-color: #f9f9f9;
            }
            h2 {
                color: #333;
            }
            .otp {
                font-size: 24px;
                margin-bottom: 20px;
            }
            .footer {
                margin-top: 20px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Otp for Thaparmegle Verification</h2>
            <p>Your OTP is:</p>
            <div class="otp">${otp}</div>
            <p>Please use this OTP to verify your account.</p>
            <div class="footer">
                <p>If you did not request this OTP, please ignore this email.</p>
            </div>
        </div>
    </body>
    </html>`);
    
    req.session.otp = otp; 
    console.log(req.session.otp);
    res.render('otp');
  });
  router.post('/verifyotp',isLoggedin,async function(req,res){
    let email= req.user;
    const otp = Object.values(req.body).join('');
    console.log(otp);
    if(otp == req.session.otp){
      const user = await userModel.findOne({email:email});
      user.verified = true;
      await user.save();
    //   res.render('edit',{footer: true,user})
      res.redirect('/profile');
      }else{
        res.send("Invalid OTP");
      }
    
  
  })

  router.get('/profile',isLoggedin, async function(req, res, next) {
    let email= req.user;
    
    const user =await  userModel.findOne({email: email});
    if(user.verified){
      res.render('profile',{user, footer: true });  
    }else{
      res.redirect('/verifyemail');
    }
    
  })

module.exports = router;