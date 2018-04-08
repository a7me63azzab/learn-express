const _=require("lodash");
const {ObjectID} = require("mongodb");
const {mongoose} = require("../db/mongoose");
const {Todo} = require("../models/todo");
const {authenticate} = require("../middleware/authenticate");

module.exports = function(app){
    app.post('/todos',authenticate,(req,res)=>{
        var todo = new Todo({
            text:req.body.text,
            _creator:req.user._id
        });
    
        todo.save().then((docs)=>{
            console.log("todo saved:",docs);
            res.send(docs);
        },(err)=>{
            console.log("UNable to save todo");
            res.status(400).send(err)
            });
    });
    
    app.get('/todos',authenticate,(req,res)=>{
         Todo.find({_creator:req.user._id}).then((todos)=>{
             console.log(JSON.stringify(todos,undefined,2));
             res.send({todos});
         },(err)=>{
             console.log(err);
             res.status(400).send(err);
         });
    });
    
    app.get('/todos/:id',authenticate,(req,res)=>{
        var id = req.params.id;
        if(!ObjectID.isValid(id)){
            return res.status(404).send();
        }
        Todo.findOne({
            _id:id,
            _creator:req.user._id
        }).then((todo)=>{
            console.log("ahmed",todo);
            if(!todo){
                return res.status(404).send();
            }
            res.send({todo});
        }).catch((err)=>{
           res.status(400).send();
        });
    });
    
    app.delete('/todos/:id',authenticate,(req,res)=>{
        var id = req.params.id;
        if(!ObjectID.isValid(id)){
            return res.status(404).send();
        }
        Todo.findByIdAndRemove({
            _id:id,
            _creator:req.user.id
        }).then((todo)=>{
            if(!todo){
                return res.status(404).send();
            }
            res.send({todo});
        }).catch((err)=>{
          res.status(404).send();
        });
        
    });
    
    app.patch('/todos/:id',authenticate,(req,res)=>{
        var id = req.params.id;
        var body = _.pick(req.body,['text','completed']);
        if(!ObjectID.isValid(id)){
            res.status(404).send();
        }
         
        if(_.isBoolean(body.completed) && body.completed){
            body.completedAt = new Date().getTime();
        }else{
            body.completed=false;
            body.completedAt=null;
        }
    
        Todo.findByIdAndUpdate({
            _id:id,
            _creator:req.user.id
        },{$set:body},{new:true}).then((todo)=>{
         if(!todo){
             res.status(404).send();
         }
          res.send({todo});
        }).catch((err)=>{
          res.status(400).send();
        });
    
    });
    
    
}