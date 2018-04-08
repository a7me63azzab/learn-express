const _=require("lodash");
const {ObjectID} = require("mongodb");
const {mongoose} = require("../db/mongoose");
const {User} = require("../models/user");
const {authenticate} = require("../middleware/authenticate");
const multer = require('multer');

// initialize multer and add configuration to it
const storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null,'./server/public/uploads/files');
    },
    filename:function(req, file, cb){
        cb(null, new Date().toISOString() + file.originalname );
    }
});

const fileFilter=(req, file, cb)=>{
    if(file.mimetype === 'image/jpg' || file.mimetype === 'image/png'){
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
            fileSize: 1024 * 1024 * 5
        },
        fileFilter:fileFilter
    }); 

module.exports = function(app){
        // POST /users
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

        app.get('/users/me',authenticate,(req,res)=>{
        res.send(req.user);
        });

        // POST /users/login
        app.post('/users/login',(req,res)=>{
            var body = _.pick(req.body,['email','password']);
            User.findByCredentials(body.email,body.password).then((user)=>{
                return  user.generateAuthToken().then((token)=>{
                    res.header('x-auth', token).send(user);
                });
            }).catch((err)=>{
                res.status(400).send();
            });
        })

        // user logout
        app.delete('/users/me/token',authenticate,(req,res)=>{
            req.user.removeToken(req.token).then(()=>{
                res.status(200).send();
            }).catch((err)=>{
                res.status(400).send();
            });
        });
}