const {Post} = require('../models/post');
const _=require("lodash");
const {ObjectID} = require("mongodb");
const multer = require('multer');
const fs = require('fs');
const {authenticate} =require('../middleware/authenticate');

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

module.exports = (app)=>{

    //CREATE NEW POST
    app.post('/post/create',authenticate,upload.single('postImage'),(req, res)=>{
        console.log(req.file);
        let postData = {
            postImage:"http://localhost:3000/"+req.file.path,
            text:req.body.text,
            _creator:req.user._id
        }
        let post = new Post(postData);
        post.save().then((post)=>{
            if(!post) return res.status(404).send();
            res.status(200).send(post);
        }).catch(err=>{
            res.status(404).send();
        });
    });

    //GET POST BY ID
    app.get('/post/:id',authenticate,(req, res)=>{
        let id = req.params.id;
        if(!ObjectID.isValid(id)) return res.status(404).send();
        Post.findOne({
            _id:id,
            _creator:req.user._id
        }).then(post =>{
            if(!post) return res.status(404).send();
            res.status(200).send(post);
        }).catch(err=>{
            res.status(404).send();
        });
    });
    


    //GET ALL POSTS
    app.get('/posts',authenticate,(req, res)=>{
        Post.find({
            _creator:req.user._id
        }).then(posts=>{
            if(!posts)  return res.status(404).send();
            res.status(200).send(posts);
        }).catch(err=>{
            res.status(404).send();
        });
    });


    /* UPDATE POST 
       ------------ */
       
    app.patch('/post/update/:id',authenticate,upload.single('postImage'),(req, res)=>{
        let id = req.params.id;
        if(!ObjectID.isValid(id)) return res.status(404).send();
        let updatedData = {
            postImage:req.file.path,
            text:req.body.text,
            _creator:req.user._id
        }
        Post.findByIdAndUpdate({
            _id:id,
            _creator:req.user._id
        },{$set:updatedData},{new:true}).then(post =>{
            if(!post)  return res.status(404).send();
            res.status(200).send(post);
        }).catch(err=>{
            res.status(404).send();
        });
    });


    //DELETE POST
    app.delete('/post/delete/:id',authenticate,(req, res)=>{
        let id = req.params.id;
        if(!ObjectID.isValid(id)) return res.status(404).send();
        Post.findByIdAndRemove({
            _id:id,
            _creator:req.user._id
        }).then(post =>{
            if(!post) return res.status(404).send();
            console.log(post.postImage);
            //REMOVE IMAGE FROM SYSTEM STORAGE
            let imageName = post.postImage.split('/').pop();
            fs.unlink(`public/uploads/files/${imageName}`, (err)=> {
                if(err && err.code == 'ENOENT') {
                    // file doens't exist
                    console.info("File doesn't exist, won't remove it.");
                } else if (err) {
                    // other errors, e.g. maybe we don't have enough permission
                    console.error("Error occurred while trying to remove file");
                } else {
                    console.info(`removed`);
                }
            });
            res.status(200).send({removed:post});
        }).catch(err =>{
            res.status(404).send();
        });
    });

}