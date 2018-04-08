const {MongoClient ,ObjectID} = require("mongodb");

MongoClient.connect('mongodb://localhost:27017',(err,client)=>{
    var db = client.db("TodoApp");
    if(err){
        return console.log("Unable to connect to MongoDB server.");
    }
    console.log("Connected to MongoDB server");

    // db.collection("Todos").find({completed:false}).toArray().then((docs)=>{
    //      console.log("Todos collection :");
    //      console.log(JSON.stringify(docs,undefined,2));
    // },(err)=>{
    //      console.log("Unable to fetch todos collection ." ,err);
    // });

//     db.collection("Users").find().count().then((count)=>{
//         console.log(`Todos Count : ${count}`);
//    },(err)=>{
//         console.log(err);
//    });


db.collection("Users").find().toArray().then((docs)=>{
    console.log("Information User [ahmed azzab]");
    console.log(JSON.stringify(docs,undefined,2));
},(err)=>{
    console.log(err);
});
   
    // client.close();
});


