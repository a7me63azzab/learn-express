const {ObjectID} = require('mongodb');
const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');


//remove all docs
// Todo.remove({}).then((res)=>{
//   console.log(res);
// },(err)=>{
//   console.log(err);
// });

//findOneAndRemove => remove and return a specific doc
// var id="5a4b4fd6e659553756557966";

// Todo.findOneAndRemove(id).then((todo)=>{
//    if(!todo){
//       console.log("toso is not found");
//    }
//    console.log(JSON.stringify(todo,undefined,2));
// },(err)=>{
//    console.log(err);
// });

//findByIdAndRemove
var id="5a4b5003e659553756557972";

Todo.findByIdAndRemove(id).then((todo)=>{
   if(!todo){
      console.log("toso is not found");
   }
   console.log(JSON.stringify(todo,undefined,2));
},(err)=>{
   console.log(err);
});
