const express = require("express");
const bodyParser = require("body-parser");
const {mongoose} = require("./db/mongoose");


const app = express();

app.use(bodyParser.json());

//load all routes
require('./routes')(app);

app.listen(3000,()=>{
    console.log('Started on port 3000');
});