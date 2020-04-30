var socket = require('socket.io');
var express = require('express');
var app = express();

var numPlayers = 0;
var names = [null, null, null, null]
var scores = [null, null, null, null]

//I use this to get the users city/country
var expressip = require('express-ip')
app.use(expressip().getIpInfoMiddleware);

//Allows me to serve files from the public folder
app.use(express.static('public'));

//start the server
var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log("Server is listening at http://%s:%s", host, port);
});

//when a user lands on the index page
app.get('/', function (req, res) {
   var ipInfo = req.ipInfo;
   console.log("\nServed index file to IP address %s", req.ip);
   console.log("City: %s \t\t Country: %s", ipInfo.city, ipInfo.country);
   res.sendFile( __dirname + "/public/start.html");
})



//creates the web socket
var io = socket(server);
io.sockets.on('connection', function(socket){

   //when a new player joins the game
   socket.on('playerRequest', function (playerName){
      console.log("\n%s attempting to join the game. SocketID: %s \t IP Address: %s", playerName, socket.id, socket.handshake.address);

      if (numPlayers < 4){
         //might not be last slot that is empty (if some other user left)
         var idx = names.indexOf(null);
         if (idx != -1){
            names[idx] = playerName;
            scores[idx] = 0;
            numPlayers += 1;
         }
         else {
            console.log("ERROR: cannot insert new player but think there are less than 4 players")
         }         

         console.log("%s has joined as player %s", playerName, idx + 1)
                     
         //broadcast player list to all clients (including the one that just connected
         io.sockets.emit('playerListChanged', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
      else{
         console.log("New player %s tried to join, game is full", playerName)
         socket.emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
   })


   //when an audience member joins the game, send the state info ONLY TO THAT CONNECTION
   socket.on('audienceRequest', function(data){
      console.log("New audience member");
      socket.emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
   })


   //when a player leaves the game
   socket.on('leaveGame', function(playerInfo){
      departingPlayer = JSON.parse(playerInfo)
      //ignore refreshes when there are no players (due to reboot) and observers leaving
      if (numPlayers > 0 && departingPlayer.name != "AUDIENCE_MEMBER"){
         console.log("%s (player %s) left the game", departingPlayer.name, departingPlayer.number);
         numPlayers -= 1;
         names[departingPlayer.number - 1] = null;
         scores[departingPlayer.number - 1] = 0;
         io.sockets.emit('playerListChanged', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
   })
})

//when a user lands on the index page
app.get('/', function (req, res) {
   res.sendFile( __dirname + "/public/index.htm");
   var ipInfo = req.ipInfo;
   console.log("\nServed index file to IP address %s", req.ip);
   console.log("City: %s \t\t Country: %s", ipInfo.city, ipInfo.country);
})





