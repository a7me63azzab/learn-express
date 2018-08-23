const {File} = require('../models/file');
const _=require("lodash");
let randomstring = require('randomstring');
let crypto = require('crypto-js');
const {ObjectID} = require("mongodb");
const multer = require('multer');
const fs = require('fs');
const {authenticate} =require('../middleware/authenticate');


let _generateUniqueFileName = () => crypto.SHA256(randomstring.generate() + new Date().getTime() + 'hasve').toString();

// initialize multer and add configuration to it
const storage = multer.diskStorage({
    destination:function(req, file, cb){
        cb(null,'./public/uploads/images');
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

module.exports = (app)=>{

    //UPLOAD NEW FILE
    app.post('/image/upload',upload.single('file'),(req, res)=>{
        console.log(req.file);
        let fileData = {
            originalName:req.file.originalname,
            fileName:req.file.filename,
            mimeType:req.file.mimetype,
            size:req.file.size,
            path:req.file.path,
            url:"http://localhost:5000/"+req.file.path
        }
        let file = new File(fileData);
        file.save().then((file)=>{
            if(!file) return res.status(404).send();
            res.status(200).send(file);
        }).catch(err=>{
            res.status(404).send();
        });
    });

    //GET FILE BY ID
    app.get('/image/:id',authenticate,(req, res)=>{
        let id = req.params.id;
        if(!ObjectID.isValid(id)) return res.status(404).send();
        File.findOne({
            _id:id
        }).then(file =>{
            if(!file) return res.status(404).send();
            res.status(200).send(file);
        }).catch(err=>{
            res.status(404).send();
        });
    });

    //GET ALL FILES
    app.get('/images',(req, res)=>{
        console.log('get all files');
        File.find({"mimeType" : { $regex: "image/*"}}).then(files=>{
            if(!files) return res.status(404).send();
            res.status(200).send(files);
        }).catch(err=>{
            res.status(404).send(err);
        });
    });



    //DELETE CURRENT AUTHENICATED USER FILE
    app.delete('/image/delete',authenticate,(req, res)=>{

        //REMOVE FILE FROM SYSTEM STORAGE
        let fileName = req.user.imageUrl.split('/').pop();
        fs.unlink(`public/uploads/images/${fileName}`, (err)=> {
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

        File.findOneAndRemove({
            fileName:fileName
        }).then(file =>{
            if(!file) return res.status(404).send({err:true});
            res.status(200).send({removed:file});
        }).catch(err =>{
            res.status(404).send();
        });

    });


    //DELETE FILE BY ID
    app.delete('/image/delete/:id',authenticate,(req, res)=>{
        let id = req.params.id;
        if(!ObjectID.isValid(id)) return res.status(404).send();
        File.findByIdAndRemove({
            _id:id
        }).then(file =>{
            if(!file) return res.status(404).send({err:true});
            //REMOVE FILE FROM SYSTEM STORAGE
            let fileName = file.url.split('/').pop();
            fs.unlink(`public/uploads/images/${fileName}`, (err)=> {
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
            res.status(200).send({removed:file});
        }).catch(err =>{
            res.status(404).send();
        });
    });

}
