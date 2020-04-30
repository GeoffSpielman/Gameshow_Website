var express = require('express');
var app = express();

//I use this to get the users city/country
var expressip = require('express-ip')
app.use(expressip().getIpInfoMiddleware);

//Allows me to serve files from the public folder
app.use(express.static('public'));

//start the server
var server = app.listen(3002, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log("Static server is listening at http://%s:%s", host, port);
});


//when a user lands on the index page
app.get('/', function (req, res) {
   var ipInfo = req.ipInfo;
   console.log("\nServed index file to IP address %s", req.ip);
   console.log("City: %s \t\t Country: %s", ipInfo.city, ipInfo.country);
   res.sendFile( __dirname + "/public/start.html");
})





