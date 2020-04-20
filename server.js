var express = require('express');
var app = express();

app.use(express.static('public'));


// req = request, res = response
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/index.htm");
    console.log("Served up the index file")
})

app.get('/process_get', function(req, res){
    console.log("Player name: " + req.query.player_name);
    res.sendFile(__dirname + "/public/gamescreen.htm");
})

var server = app.listen(8081, function(){
    var host = server.address().address
    var port = server.address().port

    console.log("Server listeining at http://%s:%s", host, port)
})