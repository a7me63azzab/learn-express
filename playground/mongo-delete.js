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

    // delete all socuments that have text [Eat lunch]

    // db.collection("Todos").find({text:"Eat lunch"}).toArray().then((docs)=>{
    //     console.log(JSON.stringify(docs,undefined,2));
    // },(err)=>{
    //     console.log(err);
    // });
    //[delete many]
    // db.collection("Todos").deleteMany({text:"Eat lunch"}).then((docs)=>{
    //     console.log(docs.deletedCount);
    // },(err)=>{
    //     console.log(err);
    // });

    //[delete one]


    // db.collection("Todos").deleteOne({text:"System administration"}).then((result)=>{
    //     console.log(result);
    // },(err)=>{
    //     console.log(err);
    // });

    //  find one and delete 
    // db.collection("Todos").findOneAndDelete({text:"System administration"}).then((result)=>{
    //     console.log(result.value)
    // },(err)=>{
    //     console.log(err)
    // });

    // db.collection("Users").deleteMany({name:"ahmed azzab"}).then((result)=>{
    //     console.log(result.deletedCount);
    // },(err)=>{
    //     console.log(err);
    // });

    //{_id:"5a49296d75662f3dc8988c0a"}

    db.collection("Users").findOneAndDelete({_id: new ObjectID("5a49296d75662f3dc8988c0a")}).then((r)=>{
        console.log(r.value);
    },(err)=>{
        console.log(err);
    });


    
        // client.close();
});


