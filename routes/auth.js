const _=require("lodash");
const {ObjectID} = require("mongodb");
const {mongoose} = require("../db/mongoose");
const {User} = require("../models/user");
const {authenticate} = require("../middleware/authenticate");
const multer = require('multer');
const async = require('async');
const crypto = require('crypto');
var nodemailer = require('nodemailer');
var mg = require('nodemailer-mailgun-transport');

// initialize multer and add configuration to it
const storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null,'./public/uploads/files');
    },
    filename:function(req, file, cb){
        cb(null, new Date().toISOString() + file.originalname );
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
        app.post('/users', upload.single('userImage') ,(req, res) => {
            console.log(req.file);
            // var body = _.pick(req.body, ['email', 'password']);
            var body={
                userImage:req.file.path,
                email:req.body.email,
                password:req.body.password
            }
            var user = new User(body);
        
            user.save().then(() => {
            return user.generateAuthToken();
            }).then((token) => {
            res.header('x-auth', token).send(user);
            }).catch((e) => {
            res.status(400).send(e);
            })
        });

        //GET USER
        app.get('/users/me',authenticate,(req,res)=>{
        res.send(req.user);
        });

        // USER LOGIN
        app.post('/users/login',(req,res)=>{
            var body = _.pick(req.body,['email','password']);
            console.log(body);
            User.findByCredentials(body.email,body.password).then((user)=>{
                return  user.generateAuthToken().then((token)=>{
                    res.header('x-auth', token).send(user);
                });
            }).catch((err)=>{
                res.status(400).send();
            });
        });

        //FORGET PASSWORD
        app.post('/users/forget',(req, res, next)=>{
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
        app.post('/users/reset/:token', function(req, res) {
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
        app.delete('/users/me/token',authenticate,(req,res)=>{
            req.user.removeToken(req.token).then(()=>{
                res.status(200).send();
            }).catch((err)=>{
                res.status(400).send();
            });
        });
}