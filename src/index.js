const express = require('express');
const bodyParser = require('body-parser');
const route = require('../src/route/route');
const mongoose = require('mongoose');
const multer = require("multer")
const app = express();

app.use(bodyParser.json());

mongoose.connect("mongodb+srv://amanmahto:anuragf45@amanscluster.os0m9fw.mongodb.net/group39Database?retryWrites=true&w=majority", {
    useNewUrlParser: true
})
    .then(() => console.log("MongoDb is connected"))
    .catch(err => console.log(err))

app.use(multer().any())
app.use('/', route);

app.all("/*", function (req, res) {
    res.status(404).send({ status: false, message: "Incorrect URL" });
});

app.listen(process.env.PORT || 3000, function () {
    console.log('Express app running on port ' + (process.env.PORT || 3000))
});