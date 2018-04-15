const mongoose = require("mongoose");
const _ = require('lodash');


const FileSchema = new mongoose.Schema({
    mimeType:{type:String},
    originalName:{type:String},
    fileName:{type:String},
    url:{type:String, required:true},
    createdAt:{type:Date, default:Date.now},
    size:{type:Number},
    path:{type:String}
});

FileSchema.methods.toJSON=function(){
    var file = this;
    var fileObject = file.toObject();
    return _.pick(fileObject,['_id','url']);
}

// Sets the createdAt parameter equal to the current time
FileSchema.pre('save', next => {
  now = new Date();
  if(!this.createdAt) {
    this.createdAt = now;
  }
  next();
});


var File = mongoose.model('File',FileSchema);

module.exports={File};
