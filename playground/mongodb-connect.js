const {MongoClient} = require("mongodb");

MongoClient.connect('mongodb://localhost:27017',(err,client)=>{
    var db = client.db("TodoApp");
    if(err){
        return console.log("Unable to connect to MongoDB server.");
    }
    console.log("Connected to MongoDB server");
    // db.collection('Todos').insertOne({
    //     text:"something to do",
    //     completed:false
    // },(err,result)=>{
    //     if(err){
    //        return console.log("Unable to insert Todo ",err);
    //     }
    //     console.log(JSON.stringify(result.ops,undefined,2));
    // });


    // db.collection("Users").insertOne({
    //    name:"ahmed azzab",
    //    age:24,
    //    location: "Cairo ,Egypt"
    // },(err,result)=>{
    //     if(err){
    //          console.log("Unable to insert Users", err);
    //     }
    //     console.log(JSON.stringify(result.ops,undefined,2));
    // });
    client.close();
});


