const {MongoClient ,ObjectID} = require("mongodb");

MongoClient.connect('mongodb://localhost:27017',(err,client)=>{
    var db = client.db("TodoApp");
    if(err){
        return console.log("Unable to connect to MongoDB server.");
    }
    console.log("Connected to MongoDB server");
// update

// db.collection('Todos').findOneAndUpdate({
//     _id: new ObjectID("5a49ed8f007168c8f99dd4f4")
// },{
//     $set:{
//         completed:false
//     }
// },{
//     returnOriginal:false
// }).then((result)=>{
//     console.log(JSON.stringify(result,undefined,2));
// },(err)=>{
//     console.log(err);
// });

  db.collection("Users").findOneAndUpdate({
      _id: new ObjectID('5a492a2dc54ea43e2c5fa6cc')
  },{
      $set:{
          name:"The Crew"
      },
      $inc:{
          age:1
      }
  },{
      returnOriginal:false
  }).then((result)=>{
      console.log(result.value);
  },(err)=>{
      console.log(err);
  });
    
        // client.close();
});


