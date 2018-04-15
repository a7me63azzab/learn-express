const mongoose = require("mongoose");
const _ = require('lodash');


const PostSchema = new mongoose.Schema({
    postImage:{type:String, required:true},
    text:{
        type:String,
        required:true,
        trim:true
    },
    createdAt:{ type: Date, default: Date.now },
    _creator:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    }
});

PostSchema.methods.toJSON=function(){
    var post = this;
    var postObject = post.toObject();
    return _.pick(postObject,['_id','postImage','text','createdAt','_creator']);
}

// Sets the createdAt parameter equal to the current time
PostSchema.pre('save', next => {
  now = new Date();
  if(!this.createdAt) {
    this.createdAt = now;
  }
  next();
});


var Post = mongoose.model('Post',PostSchema);

module.exports={Post};
