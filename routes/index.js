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
  router.get('/forgetpassword', function(req, res, next) {
    res.render('forgetpassword');
  });
  router.post('/reset-password', async function(req, res, next) {
   
      
      try {
        let user = await userModel.findOne({email: req.body.email});
        if (!user) {
          res.send("Email Not Found In the Database , You could Create a new Account with Email");
          }
        else{
          await sendEmail(user.email, 'Your Email And Password for Thaparmegle', `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Thaparmegle Account Details</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            padding-bottom: 20px;
        }

        .header img {
            width: 150px;
        }

        .content {
            padding: 20px;
            line-height: 1.6;
        }

        .content h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #0073e6;
        }

        .content p {
            margin: 10px 0;
            font-size: 16px;
        }

        .button {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 15px;
            background-color: #0073e6;
            color: #ffffff;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
        }

        .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666666;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="header">
            <img src="https://ik.imagekit.io/mrigkfqmvc/Black%20and%20Beige%20Minimalist%20Aesthetic%20Modern%20Simple%20Typography%20Agency%20Logo%20(2).png?updatedAt=1724216813136" alt="Thaparmegle">
        </div>
        <div class="content">
            <h1>Welcome to Thaparmegle!</h1>
            <p>Hi ${user.fullName},</p>
            <p>Thank you for registering on Thaparmegle. Below are your account details:</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${user.password}</p>
            <a href="https://thaparmegle.com/login" class="button">Login to Thaparmegle</a>
            <p>If you didn’t request these details, please contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>Thaparmegle Team</p>
            <p><a href="https://thaparmegle.com">Visit our website</a></p>
        </div>
    </div>
</body>

</html>
`);
res.send("Pls Check Your Email For Password");
        }
      } catch (error) {
        
      }
  });

module.exports = router;