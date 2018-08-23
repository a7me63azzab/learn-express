const _=require("lodash");
const {File} = require('../models/file');
const {ObjectID} = require("mongodb");
const {mongoose} = require("../db/mongoose");
const {User} = require("../models/user");
const {authenticate} = require("../middleware/authenticate");
const async = require('async');
//const crypto = require('crypto');
let crypto = require('crypto-js');
const bcrypt = require("bcryptjs");
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');
const multer = require('multer');
const fs = require('fs');
let randomstring = require('randomstring');



const accountSid = 'AC686904f73e1e29fc675d0a37560b5e29';
const authToken = 'f2c5e0fa58f4ae49c1890c807cfdfbb4';
const client = require('twilio')(accountSid,authToken);

//GENERATE RANDOM STRING
let _generateUniqueFileName = () => crypto.SHA256(randomstring.generate() + new Date().getTime() + 'hasve').toString();

// GENERATE RANDOM CODE
var rand = function(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}; 


// initialize multer and add configuration to it
const storage = multer.diskStorage({
  destination:function(req, file, cb){
      cb(null,'./public/uploads/files');
  },
  filename:function(req, file, cb){
      cb(null, _generateUniqueFileName() + file.originalname );
  }
});

const fileFilter=(req, file, cb)=>{
  if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
      console.log('ok');
      cb(null, true);
  }else{
      console.log('error');
      cb(null, false);
  }
}

const upload = multer(
  {
      storage:storage,
      limits:{
          fileSize: 1024 * 1024 * 100
      },
      fileFilter:fileFilter
  });

module.exports = function(app){

        // USER REGISTER
        app.post('/user/register',upload.single('file'),(req, res) => {

          console.log(req.file);
          if(req.file){
            let fileData = {
              originalName:req.file.originalname,
              fileName:req.file.filename,
              mimeType:req.file.mimetype,
              size:req.file.size,
              path:req.file.path,
              url:"http://localhost:5000/"+req.file.path
          }
          let file = new File(fileData);
          file.save();
          }

          //CHECK IF EMAIL IS REGISTERED BEFORE OR NOT
          User.findOne({
            email:req.body.email
          }).then(user =>{
              if(!user){
                  var body={
                      userName:req.body.userName,
                      name:req.body.name,
                      phoneNum:req.body.phoneNum,
                      imageUrl:req.file.path ? "http://localhost:5000/"+req.file.path :'',
                      email:req.body.email,
                      password:req.body.password
                  }
                  var user = new User(body);

                  user.save().then(user => {
                    console.log('User saved')
                  return user.generateAuthToken();
                  }).then((token) => {
                  console.log('token', token)
                  //user["token"] = token
                  console.log('user',user)
                  res.status(200).json({user, token});
                }).catch((err) => {
                  res.status(400).json({message:'token error'});
                  })
              }else{
                return res.status(404).json({message:'User already exist'});
              }
            });
        });


        //UPDATE USER PROFILE
        app.patch('/user/update/:id',authenticate,(req, res)=>{
                let id = req.params.id;
                if(!ObjectID.isValid(id)) return res.status(404).send();

                // UPDATE USERNAME | NAME | IMAGE_URL
                let updatedData = {};
                if(req.body.userName){
                  updatedData.userName = req.body.userName;
                }
                if(req.body.name){
                  updatedData.name = req.body.name;
                }
                if(req.body.imageUrl){
                  updatedData.imageUrl = req.body.imageUrl;
                }

                User.findByIdAndUpdate({
                  _id:id
                },{$set:updatedData},{new:true}).then(user=>{
                  if(!user) return res.status(404).send();
                    res.status(200).send(user);
                }).catch(err=>{
                    res.status(404).send();
                })

        });

        /* UPDATE USER PASSWORD
        ------------------------- */
         // [1] Check if the old passwrod is true or not
         app.post('/user/password/check',authenticate,(req, res)=>{
           let oldPassword = req.body.oldPassword;
           User.findByCredentials(req.user.email,oldPassword).then((user)=>{
              if(!user) return res.status(404).send({isValid:false});
              res.status(200).send({isValid:true});
           }).catch((err)=>{
               res.status(404).send({isValid:false,error:err});
           });
         });

         // [2] if old password is true then update user password
         app.patch('/user/password/update',authenticate,(req, res)=>{

                 bcrypt.genSalt(10,(err,salt)=>{
                   if(err) return res.status(404).send({success:false});
                   bcrypt.hash(req.body.newPassword,salt,(err,hash)=>{
                     if(err) return res.status(404).send({success:false});
                     User.findByIdAndUpdate({
                       _id:req.user._id
                     },
                     {
                       $set:{
                         password:hash
                      }
                   },{new:true}).then(user=>{
                      if(!user) return res.status(404).send({success:false});
                      res.status(200).send({success:true,user:user});
                   }).catch(err=>{
                     res.status(404).send({success:false,error:err});
                   });
                   });
                 });

         });


        //GET ALL USERS
        app.get('/users',authenticate,(req,res)=>{
            User.find({}).then(users =>{
                if(!users) return res.status(404).send();
                res.send({users});
            }).catch(err=>{
                res.status(400).send();
            });
        });

         //GET CURRENT AUTHENTICATED USER
         app.get('/user/me',authenticate,(req,res)=>{
            res.send(req.user);
         });

        //GET USER BY ID
        app.get('/user/:id',authenticate,(req, res)=>{
            let id = req.params.id;
            if(!ObjectID.isValid(id)) return res.status(404).send();

            User.findOne({
                _id:id
            }).then(user=>{
                if(!user) return res.status(404).send();
                res.send({user});
            }).catch(err=>{
                res.status(400).send();
            });
        });

        // USER LOGIN
        app.post('/user/login',(req,res)=>{
            var body = _.pick(req.body,['email','password']);
            User.findByCredentials(body.email,body.password).then((user)=>{
                return  user.generateAuthToken().then((token)=>{
                    res.status(200).json({user, token});
                });
            }).catch((err)=>{
                res.status(400).json({message:'Email or password not valid'});
            });
        });

        // LOGIN USER WITH PHONE NUMBER AND IF NUMBER VERIFIED GENERATE AUTHTOKEN
        app.post('/user/send',(req,res)=>{
            let phoneNum = req.body.phoneNum;
            if(!req.body.phoneNum) return res.status(400).send({message: 'there is no phone number !'})
            
            // get the user by phone number
            User.findOne({
              phoneNum:phoneNum
            }).then(user => {
              if(!user) return res.status(404).send({message: 'There is no user with this phone number'});
              var verificationCode = rand(100000, 999999);
              console.log('verificationCode',verificationCode);
              client.messages.create({
                  to:phoneNum,
                  from:'+12672027059',
                  body:`Your code is ${verificationCode}`
                }).then(message=>{
                    console.log(message.sid)
                    // Add verification code to user collection
                    User.findByIdAndUpdate({
                      _id:user._id
                    },{$set:{verificationCode:verificationCode}},{new:true}).then(user=>{
                      if(!user) return res.status(404).send();
                        res.status(200).send(user);
                    }).catch(err=>{
                        res.status(404).send();
                    })
                }).catch(err=>{
                    console.log(err)
                })

            })
        })

        // Verify phone number to login user
        app.post('/user/verify',(req, res)=>{
          let code = req.body.verificationCode;
          if(!req.body.verificationCode) return res.status(400).send({message: 'there is no verification Code !'});
          User.findOne({
            verificationCode:code
          }).then(user=>{
            if(!user) return res.status(404).send({message: 'Code is not correct'});
            // update verified number is user
            User.findByIdAndUpdate({
              _id:user._id
            },{$set:{phoneNumberVerified:true ,verificationCode:''}},{new:true}).then(user=>{
              if(!user) return res.status(404).send();
              return  user.generateAuthToken().then((token)=>{
                res.header('x-auth', token).send(user);
              });
            }).catch(err=>{
                res.status(404).send();
            })
          })
        })

        //FORGET PASSWORD
        app.post('/user/forget',(req, res, next)=>{
            console.log('email',req.body.email);
            async.waterfall([
                // generate token and path it to the next function
                function(done){
                    crypto.randomBytes(20, function(err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                      });
                }
                ,
                //find user by email and save token to user schema
                function(token, done) {
                    User.findOne({ email: req.body.email }, function(err, user) {
                      if (!user) {
                        // req.flash('error', 'No account with that email address exists.');
                        res.status(400).send({error:'No account with that email address exists.'});
                        return res.redirect('/users/forget');
                      }

                      user.resetPasswordToken = token;
                      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                      user.save(function(err) {
                        done(err, token, user);
                      });
                    });
                  },
                  function(token, user, done) {
                    var auth = {
                        auth: {
                          api_key: 'key-2d00831315021526181fc4012fa85e49',
                          domain: 'sandboxc8dd8ff058ec4b69a0d39b45e174e38b.mailgun.org'
                        }
                      }

                    var nodemailerMailgun = nodemailer.createTransport(mg(auth));

                    var mailOptions = {
                      to: user.email,
                      from: 'passwordreset@demo.com',
                      subject: 'Node.js Password Reset',
                      text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                    };
                    nodemailerMailgun.sendMail(mailOptions, function(err) {
                    //   req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                    //   res.status(200).send({info:'An e-mail has been sent to ' + user.email + ' with further instructions.'});
                      console.log('ok--------------->');
                    //   res.status(200).send({info:'An e-mail has been sent to ' + user.email + ' with further instructions.'});
                      done(err, 'done');

                    });
                  }

            ],(err)=>{
                if (err) return next(err);
                res.redirect('/users/forget');
            });
        });

        //RESET PASSWORD
        app.post('/user/reset/:token', function(req, res) {
            console.log('password',req.body.password);
            async.waterfall([
              function(done) {
                User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                  if (!user) {
                    // req.flash('error', 'Password reset token is invalid or has expired.');
                    // res.status(400).send({error:'Password reset token is invalid or has expired.'});
                    return res.redirect('back');
                  }

                  user.password = req.body.password;
                  user.resetPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;

                  user.save(function(err) {
                    console.log('user saved successfully');
                    done(err, user);
                  });
                });
              },
              function(user, done) {
                var auth = {
                    auth: {
                      api_key: 'key-2d00831315021526181fc4012fa85e49',
                      domain: 'sandboxc8dd8ff058ec4b69a0d39b45e174e38b.mailgun.org'
                    }
                  }

                var nodemailerMailgun = nodemailer.createTransport(mg(auth));

                var mailOptions = {
                  to: user.email,
                  from: 'passwordreset@demo.com',
                  subject: 'Your password has been changed',
                  text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                };
                nodemailerMailgun.sendMail(mailOptions, function(err) {
                //   req.flash('success', 'Success! Your password has been changed.');
                //   res.status(200).send({success:'Success! Your password has been changed.'});
                  done(err);
                });
              }
            ], function(err) {
              res.redirect('/');
            });
          });



        // USER LOGOUT
        app.delete('/user/logout',authenticate,(req,res)=>{
            req.user.removeToken(req.token).then(()=>{
                res.status(200).send();
            }).catch((err)=>{
                res.status(400).send();
            });
        });
}
