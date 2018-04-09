const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _=require("lodash");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    userImage:{type:String, required:true},
    email:{
        type:String,
        required:true,
        trim:true,
        minlength:1,
        unique:true,
        validate:{
            validator:validator.isEmail,
            message:"{value} is not a valid email ."
        }
    },
    password:{
        type:String,
        require:true,
        minlength:6,
    },
    tokens:[{
        access:{
            type:String,
            require:true
        },
        token:{
            type:String,
            require:true
        }
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

 UserSchema.methods.toJSON=function(){
    var user = this;
    var userObject = user.toObject();
    return _.pick(userObject,['_id','email','userImage']);
}

 UserSchema.methods.generateAuthToken = function () {
    var user = this;
    var access = 'auth';
    var token = jwt.sign({_id: user._id.toHexString(), access},'abc123').toString();
  
    user.tokens.push({access, token});
  
    return user.save().then(() => {
      return token;
    });
  };

  UserSchema.statics.findByToken = function(token){
      var User = this;
      var decoded;
      try{
        decoded = jwt.verify(token,'abc123');
      }catch(err){
         return Promise.reject();
      }
      return User.findOne({
          '_id':decoded._id,
          'tokens.token':token,
          'tokens.access':'auth'
      })
  }

  UserSchema.methods.removeToken = function(token){
    var user = this;
    return user.update({
        $pull:{
            tokens:{token}
        }
    });
     
  }
     

  UserSchema.statics.findByCredentials= function(email,password){
    console.log('entered');
    var User = this;
    return User.findOne({email}).then((user)=>{
           if(!user){
                 console.log('user not found');
                 return Promise.reject();
             }
           return new Promise((resolve,reject)=>{
               bcrypt.compare(password,user.password,(err,res)=>{
                   if(res){
                       resolve(user);
                   }else{
                      console.log('password not match');
                       reject();
                   }
               });
           });
    });
 }

// before saving the password to the database we want to hashing it .

  UserSchema.pre('save',function(next){
      var user = this;
      if(user.isModified('password')){
          bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
               user.password = hash;
               next();
            });
          });
      }else{
          next();
      }
  });

  

var User = mongoose.model('User', UserSchema);
module.exports={User};