const express = require("express");
const bodyParser = require("body-parser");
const morgan = require('morgan');
const {mongoose} = require("./db/mongoose");


const app = express();


app.use('/public', express.static('public'));

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

//load all routes
require('./routes')(app);

app.listen(5000,()=>{
    console.log('Started on port 5000');
});