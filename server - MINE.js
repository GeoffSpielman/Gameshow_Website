var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var urlencodedParser = bodyParser.urlencoded({ extended: false })


app.use(express.static('public'));



app.get('/', function (req, res) {
    res.sendFile(__dirname + "/public/index.htm");
    console.log("Served up the index file")
})

app.post('/process_post', urlencodedParser, function(req, res){
    console.log("Player name: " + req.query.player_name);
    res.sendFile(__dirname + "/public/gamescreen.htm");
})

var server = app.listen(8081, function(){
    var host = server.address().address
    var port = server.address().port

    console.log("Server listeining at http://%s:%s", host, port)
})