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
var technicianIpAddress = null;
var convoTimerStarted = null;
var silenceTimerStarted = null;
var silenceTimerValue = null;


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
});

function stringifyGameData(){
   return (JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs, 
                           "ipAddresses": ipAddresses, "hostSocketID": hostSocketID, "hostIpAddress": hostIpAddress, 
                           "technicianSocketID": technicianSocketID, "technicianIpAddress": technicianIpAddress}));
};


//creates the web socket
var io = socket(server);
io.sockets.on('connection', function(socket){

   //when a new player joins the game
   socket.on('playerRequest', function (playerName){
      console.log("\n%s attempting to join the game. SocketID: %s \t IP Address: %s", playerName, socket.id, socket.handshake.address);
      io.to(technicianSocketID).emit('consoleDelivery', playerName + " is attempting to join the game. SocketID: " +  socket.id + "... IP Address: " +  socket.handshake.address);
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
            console.log("ERROR: failed to insert new player, but numPlayers < 4")
            io.to(technicianSocketID).emit('consoleDelivery', "ERROR: failed to insert new player, but numPlayers < 4");
            return;
         }         

         console.log("%s has joined as player %s", playerName, idx + 1)
         socket.join('gameRoom');

         //broadcast player list to all clients (including the one that just connected)
         io.in('gameRoom').emit('playerListChanged', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
         io.to(technicianSocketID).emit('gameDataDelivery', stringifyGameData());
      }
      else{
         console.log("New player %s tried to join, game is full", playerName)
         io.to(technicianSocketID).emit('consoleDelivery', playerName + " attempted to join the game, but it is full. They are watching as an audience member.");
         
         socket.join('gameRoom');
         io.in('gameRoom').emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
   });

   //when an audience member joins the game, send the state info ONLY TO THAT CONNECTION
   socket.on('audienceRequest', function(data){
      console.log('New audience member');
      io.to(technicianSocketID).emit('consoleDelivery', "New audience member has joined the game.");
      socket.join('gameRoom');
      //send data only to the connecting audience member
      socket.emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
   });

   socket.on('hostRequest', function(){
      hostSocketID = socket.id;
      hostIpAddress = socket.handshake.address;
      console.log("Host just joined the game. SocketID: %s \t IP Address: %s", hostSocketID, hostIpAddress);
      socket.join('gameRoom');
      socket.join('castMembers');
      socket.emit('newCastMember', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      io.to(technicianSocketID).emit('gameDataDelivery', stringifyGameData());
      io.to(technicianSocketID).emit('consoleDelivery', 'host has entered the game');
   });

   socket.on('technicianRequest', function(){
      technicianSocketID = socket.id;
      technicianIpAddress = socket.handshake.address;
      console.log("Technician just joined the game. SocketID: %s \t IP Address: %s", technicianSocketID, technicianIpAddress);
      socket.join('castMembers');
      socket.join('gameRoom');
      socket.emit('newCastMember', stringifyGameData());
      io.to(technicianSocketID).emit('consoleDelivery', 'technician has entered the game');
   });

   socket.on('gameStartRequest', function(gameName){
      io.to(technicianSocketID).emit('consoleDelivery', 'Received game start request for ' + gameName);
      io.in('gameRoom').emit('gameStarting', gameName);
   })

   socket.on('gameEndRequest', function(){
      io.to(technicianSocketID).emit('consoleDelivery', 'Received game end request');
      io.in('gameRoom').emit('gameEnded');
   })

   socket.on('messageRequest', function(data){
      var recData = JSON.parse(data);
      //console.log("received message %s from %s ", recData.message, recData.sender);
      io.to('castMembers').emit('messageDelivery', data);
   });

   socket.on('gameDataRequest', function(){
      io.to(technicianSocketID).emit('gameDataDelivery', stringifyGameData());
   });

   socket.on('nameChangeRequest', function(newNames){
      names = newNames;
      io.in('gameRoom').emit('playerListChanged', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
   });

   socket.on('scoreChangeRequest', function(newScores){
      scores = newScores;
      console.log('technician wants to change scores to: ' + newScores);
      io.in('gameRoom').emit('playerScoresChanged', scores);
   });

   socket.on('leaveGame', function(playerInfo){
      departingPlayer = JSON.parse(playerInfo)
      console.log("%s (player %s) left the game", departingPlayer.name, departingPlayer.number);
      io.to(technicianSocketID).emit('consoleDelivery', departingPlayer.name + " (player " + departingPlayer.number + ") has left the game.");

      //I don't care about audience members or people who haven't joined the game
      if (departingPlayer.name === "AUDIENCE_MEMBER" || departingPlayer.name === null){
         return;
      }
      else if (departingPlayer.name === 'HOST_GARRETT'){
         hostSocketID = null;
         hostIpAddress = null;
      }
      else if (departingPlayer.name === 'TECHNICIAN_GEOFF'){
         technicianSocketID = null;
         technicianIpAddress = null;
      }
      else{
         numPlayers -= 1;
         names[departingPlayer.number - 1] = null;
         scores[departingPlayer.number - 1] = null;
         socketIDs[departingPlayer.number - 1] = null;
         ipAddresses[departingPlayer.number - 1] = null;
         io.in('gameRoom').emit('playerListChanged', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
      
      io.to(technicianSocketID).emit('gameDataDelivery', stringifyGameData());
   });

   // Pass the Conch
   socket.on('conchPromptRequest', function(prompt){
      io.in('gameRoom').emit('conchPromptDisplay', prompt);
      io.to(technicianSocketID).emit('consoleDelivery', 'promt requested: ' + prompt);
      silenceTimerValue = 0;
   });

   socket.on('conchConvoStartRequest', function(){
      convoTimerStarted = new Date().getTime();
      io.in('gameRoom').emit('conchConvoStart');
      io.to(technicianSocketID).emit('consoleDelivery', 'convo timer started. Timestamp: ' + convoTimerStarted);
   });

   socket.on('conchConvoStopRequest', function(){
      var convoLength = new Date().getTime() - convoTimerStarted;
      var mins = Math.floor(convoLength/60000);
      var secs = Math.floor((convoLength%60000)/1000);
      
      var score = (silenceTimerValue > 0)? Math.round((convoLength/silenceTimerValue)*100) : Math.round(convoLength/10);

      var dataToSend = JSON.stringify({"timerString": (mins < 10? '0': '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(convoLength%1000/100), "scoreEarned": score});
      io.in('gameRoom').emit('conchConvoStop', dataToSend);
      io.to(technicianSocketID).emit('consoleDelivery', 'convo timer stopped. Convo Length:  ' + convoLength);
   });

   socket.on('conchSilenceStartRequest', function(){
      silenceTimerStarted = new Date().getTime()
      io.in('gameRoom').emit('conchSilenceStart', silenceTimerValue);
      io.to(technicianSocketID).emit('consoleDelivery', 'silence timer started. Timestamp: ' + silenceTimerStarted);
   });

   socket.on('conchSilenceStopRequest', function(){
      silenceTimerValue += new Date().getTime() - silenceTimerStarted;
      var mins = Math.floor(silenceTimerValue/60000);
      var secs = Math.floor((silenceTimerValue%60000)/1000);
      io.in('gameRoom').emit('conchSilenceStop',  (mins < 10? '0' : '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(silenceTimerValue%1000/100));
      io.to(technicianSocketID).emit('consoleDelivery', 'silence timer stopped. Silence Length:  ' + silenceTimerValue);
   });

});

//when a user lands on the index page
app.get('/', function (req, res) {
   res.sendFile( __dirname + "/public/index.htm");
   var ipInfo = req.ipInfo;
   console.log("\nServed index file to IP address %s", req.ip);
   console.log("City: %s \t\t Country: %s", ipInfo.city, ipInfo.country);
})





