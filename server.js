var express = require('express');
var app = express();

//I use this to get the users city/country
var expressip = require('express-ip')
app.use(expressip().getIpInfoMiddleware);

//I use this to send data via post requests
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })

//Allows me to serve files from the public folder
app.use(express.static('public'));

app.get('/', function (req, res) {
   res.sendFile( __dirname + "/public/index.htm");
   var ipInfo = req.ipInfo;
   console.log("Served index file to IP address %s", req.ip);
   console.log("User city: %s", ipInfo.city);
   console.log("User country: %s \n", ipInfo.country);
})


app.post('/', urlencodedParser, function (req, res) {
   player_name = req.body.player_name
   console.log(player_name);
   res.sendFile(__dirname + "/public/gamescreen.htm");
})

var server = app.listen(3000, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Server is listening at http://%s:%s", host, port)
})