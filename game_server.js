var socket = require('socket.io');
var express = require('express');
var app = express();

//my game state global variables
var numPlayers = 0;
var names = [null, null, null, null];
var scores = [null, null, null, null];
var socketIDs = [null, null, null, null];
var ipAddresses = [null, null, null, null];
var hostSocketID = null;
var hostIpAddress = null;
var technicianSocketID = null;
var techniicanIpAddress = null;


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

function stringifyGameData(){
   return (JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs, 
                           "ipAddresses": ipAddresses, "hostSocketID": hostSocketID, "hostIpAddress": hostIpAddress, 
                           "technicianSocketID": technicianSocketID, "technicainIpAddress": techniicanIpAddress}));
}


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
            numPlayers += 1;
            names[idx] = playerName;
            scores[idx] = 0;
            socketIDs[idx] = socket.id;
            ipAddresses[idx] = socket.handshake.address;
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
      console.log('New audience member');
      socket.emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
   })

   socket.on('hostRequest', function(){
      hostSocketID = socket.id;
      hostIpAddress = socket.handshake.address;
      console.log("Host just joined the game. SocketID: %s \t IP Address: %s", hostSocketID, hostIpAddress);
      socket.join('castMembers');
      socket.emit('newCastMember', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
   })

   socket.on('technicianRequest', function(){
      technicianSocketID = socket.id;
      technicianIpAddress = socket.handshake.address;
      console.log("Technician just joined the game. SocketID: %s \t IP Address: %s", technicianSocketID, technicianIpAddress);
      socket.join('castMembers');
      socket.emit('newCastMember', stringifyGameData());
   })

   socket.on('messageRequest', function(data){
      var recData = JSON.parse(data);
      console.log("received message %s from %s ", recData.message, recData.sender);
      io.to('castMembers').emit('messageDelivery', data);
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





