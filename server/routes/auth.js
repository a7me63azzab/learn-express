const _=require("lodash");
const {ObjectID} = require("mongodb");
const {mongoose} = require("../db/mongoose");
const {User} = require("../models/user");
const {authenticate} = require("../middleware/authenticate");

module.exports = function(app){
        // POST /users
        app.post('/users', (req, res) => {
            var body = _.pick(req.body, ['email', 'password']);
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