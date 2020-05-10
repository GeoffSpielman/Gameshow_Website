var socket = require('socket.io');
var express = require('express');
var app = express();

//state global variables
var numPlayers = 0;
var names = [null, null, null, null];
var scores = [null, null, null, null];
var socketIDs = [null, null, null, null];
var ipAddresses = [null, null, null, null];
var hostSocketID = null;
var hostIpAddress = null;
var technicianSocketID = null;
var technicianIpAddress = null;
var showOtherHostPic = false;

//Pass the Conch
var convoTimerStarted = null;
var silenceTimerStarted = null;
var silenceTimerAccumulated = null;

//Definitely Not Pictionary
var drawStuffTimerStarted = null;

// Quizball
var qbLastUpdate;
var qbGameState;
var qbData;
var qbMotionTimer;
var qbLastServerBroadcast;
var qbFrozenSide;
const qbServerUpdatePeriod = 500;
const qbMotionPeriod = 40;
const paddleHeight = 74;
const paddleWidth = 15;
const quizBallCanvasWidth = 920;
const quizBallCanvasHeight = 464;
const qbBallRad = 9;
const leftPaddleColumn = 10;
const rightPaddleColumn = 895;




//I use this to get the users city/country
var expressip = require('express-ip')
app.use(expressip().getIpInfoMiddleware);

//Allows me to serve files from the public folder
app.use(express.static('public'));


//start the server
var server = app.listen(3000, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log('=============================================================');
   console.log("Server is listening at http://%s:%s", host, port);
});

//when a user lands on the index page
app.get('/', function (req, res) {
   var ipInfo = req.ipInfo;
   console.log("\nServed index file to IP address %s", req.ip);
   console.log("City: %s \t\t Country: %s", ipInfo.city, ipInfo.country);
   res.sendFile( __dirname + "/public/start.html");
});

function packGameData(){
   return ({"numPlayers":numPlayers, 
            "names": names, 
            "scores": scores, 
            "socketIDs": socketIDs, 
            "ipAddresses": ipAddresses, 
            "hostSocketID": hostSocketID, 
            "hostIpAddress": hostIpAddress, 
            "technicianSocketID": technicianSocketID, 
            "technicianIpAddress": technicianIpAddress});
};

function quizBallProcessMovement(overrides){
  
   deltaT = (Date.now() - qbLastUpdate)/1000;
   qbData.leftPos += qbData.leftVel * deltaT;
   qbData.rightPos += qbData.rightVel * deltaT;
   qbData.ballPosX += qbData.ballVelX * qbData.ballSpeed * deltaT;
   qbData.ballPosY += qbData.ballVelY * qbData.ballSpeed * deltaT;
   qbLastUpdate = Date.now();

   //bouncing off bottom of screen
   if (qbData.ballPosY + qbBallRad >= quizBallCanvasHeight && qbData.ballVelY > 0){
      qbData.ballVelY = -1 * qbData.ballVelY;
      qbData.ballPosY = 2 * (quizBallCanvasHeight - qbBallRad) - qbData.ballPosY;
   }
   //bouncing off the top of the screen
   else if (qbData.ballPosY <= qbBallRad && qbData.ballVelY < 0){
         qbData.ballVelY = -1 * qbData.ballVelY;
         qbData.ballPosY = 2 * qbBallRad - qbData.ballPosY;
   }
   //bouncing off right paddle
   else if (qbData.ballPosX + qbBallRad >= rightPaddleColumn && qbData.ballVelX > 0 && qbData.ballPosX + qbBallRad < rightPaddleColumn + paddleWidth/2 && (qbData.ballPosY - 1.2*qbBallRad) < (qbData.rightPos + paddleHeight/2) && (qbData.ballPosY + 1.2*qbBallRad) > (qbData.rightPos - paddleHeight/2)){
      qbData.ballVelX = -1 * qbData.ballVelX;
      qbData.ballPosX = 2 * (rightPaddleColumn - qbBallRad) - qbData.ballPosX;
   }
   //bouncing off left paddle
   else if (qbData.ballPosX - qbBallRad <= leftPaddleColumn + paddleWidth && qbData.ballVelX < 0 && qbData.ballPosX - qbBallRad > leftPaddleColumn + paddleWidth/2 &&(qbData.ballPosY - 1.2*qbBallRad) < (qbData.leftPos + paddleHeight/2) && (qbData.ballPosY + 1.2*qbBallRad) > (qbData.leftPos - paddleHeight/2)){
         qbData.ballVelX = -1 * qbData.ballVelX;
         qbData.ballPosX = 2 * (leftPaddleColumn + paddleWidth + qbBallRad) - qbData.ballPosX;
   }


   if (overrides !== null){
      if (overrides.object === 'leftPaddle'){
         qbData.leftPos = overrides.position;
         qbData.leftVel = overrides.velocity;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received LEFT PADDLE override. Pos:' + overrides.position + ' ... Vel: ' + overrides.velocity);
      }
      else if (overrides.object === 'rightPaddle'){
         qbData.rightPos = overrides.position;
         qbData.rightVel = overrides.velocity;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received RIGHT PADDLE override. Pos:' + overrides.position + ' ... Vel: ' + overrides.velocity);
      }
      else if (overrides.object === 'ball'){
         qbData.ballSpeed = overrides.ballSpeed;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received BALL SPEED override. ballSpeed: ' + overrides.ballSpeed);
      }
      else if (overrides.object === 'paddleFreeze'){
         if(overrides.side === 'left'){
            qbData.leftVel = 0;
         }
         else if (qbData.rightVel === 'right'){
            qbData.rightVel = 0;
         }
      }
      io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
   }
   else if(Date.now() - qbLastServerBroadcast > qbServerUpdatePeriod){
      //no overrides, its just time to send a broadcast
      qbLastServerBroadcast = Date.now();
      io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| regular server kinematics broadcast');
      io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);

   }
}

function resetQuizBallData(){
   qbGameState = 'reset';
   qbFrozenSide = 'neither';
   qbData = {
      'ballSpeed': 50,
      'ballPosX': 50,
      'ballPosY':  232,
      'ballVelX': Math.cos(Math.PI/6),
      'ballVelY': -Math.sin(Math.PI/6),
      'leftPos': 232,
      'leftVel': 0,
      'rightPos': 232,
      'rightVel': 0   
   };
}

//creates the web socket
var io = socket(server);

//all of the socket functions
io.sockets.on('connection', function(socket){

   //when a new player joins the game
   socket.on('playerRequest', function (playerName){
      console.log("\n%s attempting to join the game. SocketID: %s \t IP Address: %s", playerName, socket.id, socket.handshake.address);
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + playerName + " is attempting to join the game. SocketID: " +  socket.id + "... IP Address: " +  socket.handshake.address);
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
            io.to(technicianSocketID).emit('consoleDelivery', "|GAME SERVER| ERROR: failed to insert new player, but numPlayers < 4");
            return;
         }         

         console.log("%s has joined as player %s", playerName, idx + 1)
         socket.join('gameRoom');

         //broadcast player list to all clients (including the one that just connected)
         io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores,  "socketIDs": socketIDs});
         io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
      }
      else{
         console.log("New player %s tried to join, game is full", playerName)
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + playerName + " attempted to join the game, but it is full. They are watching as an audience member.");
         
         socket.join('gameRoom');
         io.in('gameRoom').emit('newObserver', JSON.stringify({"numPlayers":numPlayers, "names": names, "scores": scores}));
      }
   });

   //when an audience member joins the game, send the state info ONLY TO THAT CONNECTION
   socket.on('audienceRequest', function(data){
      console.log('New audience member');
      io.to(technicianSocketID).emit('consoleDelivery', "|GAME SERVER| New audience member has joined the game.");
      socket.join('gameRoom');
      //send data only to the connecting audience member
      socket.emit('newObserver', {"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs});
   });

   socket.on('hostRequest', function(){
      hostSocketID = socket.id;
      hostIpAddress = socket.handshake.address;
      console.log("Host just joined the game. SocketID: %s \t IP Address: %s", hostSocketID, hostIpAddress);
      socket.join('gameRoom');
      socket.join('castMembers');
      socket.emit('newCastMember', {"numPlayers":numPlayers, "names": names, "scores": scores});
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| host has entered the game');
   });

   socket.on('technicianRequest', function(){
      technicianSocketID = socket.id;
      technicianIpAddress = socket.handshake.address;
      console.log("Technician just joined the game. SocketID: %s \t IP Address: %s", technicianSocketID, technicianIpAddress);
      socket.join('castMembers');
      socket.join('gameRoom');
      socket.emit('newCastMember', packGameData());
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| technician has entered the game');
   });

   socket.on('gameDeployRequest', function(gameName){
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| Received game deploy request for ' + gameName);
      io.in('gameRoom').emit('gameDeploying', gameName);
      
      if (gameName === 'Quizball'){
         resetQuizBallData();
         // KinematicsUpdate -> RegenerateGraphics on client
         io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
         io.in('gameRoom').emit('quizBallControlUpdate', 'reset');
         io.in('gameRoom').emit('quizBallFreezeUpdate', qbFrozenSide);
      }
   })

   socket.on('gameEndRequest', function(){
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| Received game end request');
      io.in('gameRoom').emit('gameEnded');
   })

   socket.on('messageRequest', function(data){
      var recData = JSON.parse(data);
      //console.log("received message %s from %s ", recData.message, recData.sender);
      io.to('castMembers').emit('messageDelivery', data);
   });

   socket.on('gameDataRequest', function(){
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
   });

   socket.on('nameChangeRequest', function(newNames){
      names = newNames;
      io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores,  "socketIDs": socketIDs});
   });

   socket.on('scoreChangeRequest', function(newScores){
      scores = newScores;
      console.log('technician wants to change scores to: ' + newScores);
      io.in('gameRoom').emit('playerScoresChanged', scores);
   });

   socket.on('toggleHostPicRequest', function(){
      showOtherHostPic = !showOtherHostPic;
      io.in('gameRoom').emit('toggleHostPic', showOtherHostPic);
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| Host pic change request. Showing Geoff: ' + showOtherHostPic);
   });

   socket.on('technicianSoundRequest', function(soundName){
      io.in('gameRoom').emit('technicianSoundDelivery', soundName);
   });
   
   socket.on('technicianStopSoundRequest', function(){
      io.in('gameRoom').emit('technicianStopSoundDelivery');
   });

   socket.on('leaveGame', function(departingPlayer){
      
      //if you were a player from the current server session
      if (numPlayers > 0 && socketIDs.indexOf(departingPlayer.socketID) !== -1){
         numPlayers -= 1;
         names[departingPlayer.ID - 1] = null;
         scores[departingPlayer.ID - 1] = null;
         socketIDs[departingPlayer.ID - 1] = null;
         ipAddresses[departingPlayer.ID - 1] = null;
         io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs});
      }
      else if (departingPlayer.name === 'HOST_GARRETT' && departingPlayer.socketID === hostSocketID){
         hostSocketID = null;
         hostIpAddress = null;
      }
      else if (departingPlayer.name === 'TECHNICIAN_GEOFF' && departingPlayer.socketID === technicianSocketID){
         technicianSocketID = null;
         technicianIpAddress = null;
      }
      else{
         return;
      }
      console.log("%s (player %s) left the game. Socket ID: %s", departingPlayer.name, departingPlayer.ID, departingPlayer.socketID);
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + departingPlayer.name + " (player " + departingPlayer.ID + " , socketID: " + departingPlayer.socketID + " ) has left the game.");
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
   });



   // Pass the Conch
   socket.on('conchPromptRequest', function(prompt){
      io.in('gameRoom').emit('conchPromptDisplay', prompt);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| promt requested: ' + prompt);
   });

   socket.on('conchConvoStartRequest', function(){
      convoTimerStarted = Date.now();
      io.in('gameRoom').emit('conchConvoStart');
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| convo timer started. Timestamp: ' + convoTimerStarted);
      silenceTimerAccumulated = 0;
   });

   socket.on('conchConvoStopRequest', function(){
      var convoLength = Date.now() - convoTimerStarted;
      var mins = Math.floor(convoLength/60000);
      var secs = Math.floor((convoLength%60000)/1000);

      var score = (silenceTimerAccumulated > 0)? Math.round((convoLength/silenceTimerAccumulated)*100) : Math.round(convoLength/10);
      var dataToSend = {
         "timerString": (mins < 10? '0': '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(convoLength%1000/100), 
         "scoreEarned": score};
      io.in('gameRoom').emit('conchConvoStop', dataToSend);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| convo timer stopped. Convo Length:  ' + convoLength);
   });

   socket.on('conchSilenceStartRequest', function(){
      silenceTimerStarted = Date.now()
      io.in('gameRoom').emit('conchSilenceStart', silenceTimerAccumulated);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| silence timer resumed. Timestamp: ' + silenceTimerStarted +  '  Accumulated: ' + silenceTimerAccumulated);
   });

   socket.on('conchSilenceStopRequest', function(){
      silenceTimerAccumulated += Date.now() - silenceTimerStarted;
      var mins = Math.floor(silenceTimerAccumulated/60000);
      var secs = Math.floor((silenceTimerAccumulated%60000)/1000);
      io.in('gameRoom').emit('conchSilenceStop',  (mins < 10? '0' : '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(silenceTimerAccumulated%1000/100));
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| silence timer stopped. Silence Length:  ' + silenceTimerAccumulated);
   });

   // Name the Animal
   socket.on('playAnimalNoiseRequest', function(animalName){
      io.in('gameRoom').emit('playAnimalNoise',  animalName);
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| animal noise requested: ' + animalName);
   });

   socket.on('showAnimalAnswerRequest', function(){
      io.in('gameRoom').emit('showAnimalAnswer');
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| cast requested to show the answer (anmial game)');
   })

   socket.on('clearAnimalAnswerRequest', function(){
      io.in('gameRoom').emit('clearAnimalAnswer');
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| cast requested to clear the answer (anmial game)');
   })

   // Definitely Not Pictionary
   socket.on('drawingPromptRequest', function(data){
      var recData = JSON.parse(data);
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| artistID ' + recData.artistID + ' just received prompt: ' + recData.prompt);
      io.in('gameRoom').emit('showDrawingPrompt', data);
   });

   socket.on('drawStuffStartRequest', function(){
      drawStuffTimerStarted = Date.now();
      io.in('gameRoom').emit('drawStuffStartTimer', drawStuffTimerStarted);
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| draw stuff timer started. Timestamp: ' + drawStuffTimerStarted);
   });

   socket.on('mouseDownMoveData', function(data){
      io.in('gameRoom').emit('drawOnCanvas', data);
   });

   socket.on('drawingResetRequest', function(){
      io.in('gameRoom').emit('drawStuffResetGame');
   });

   //Quizball
   socket.on('quizBallPromptRequest', function(promptString){
      io.in('gameRoom').emit('quizBallShowPrompt', promptString);
      io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| prompt request:  ' + promptString);
   });
   
   socket.on('quizBallPlayerChangeRequest', function(data){
      io.in('gameRoom').emit('quizBallPlayersChanged', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| player change request. Side: ' + data.sideToChange);
   });

   socket.on('quizBallControlRequest', function(req){
      qbGameState = req;
      io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| new game state: ' + qbGameState);
      io.in('gameRoom').emit('quizBallControlUpdate', qbGameState);
      
      if (qbGameState === 'reset'){
         clearInterval(qbMotionTimer);
         resetQuizBallData();
         io.in('gameRoom').emit('quizBallFreezeUpdate', qbFrozenSide);
         io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
      }
      else if (qbGameState === 'paused'){
         clearInterval(qbMotionTimer);
         quizBallProcessMovement(null);
         io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
      }
      else if (qbGameState === 'active'){
         qbLastUpdate = Date.now();
         qbLastServerBroadcast = Date.now();
         io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
         qbMotionTimer = setInterval(function(){quizBallProcessMovement(null);},  qbMotionPeriod);
      }
   });

   
   socket.on('quizBallKinematicsModifyRequest', function(data){     
      clearInterval(qbMotionTimer);
      
      if (qbGameState === 'active'){
         quizBallProcessMovement(data);
         qbMotionTimer = setInterval(function(){quizBallProcessMovement(null);},  qbMotionPeriod);
      }
      else if (data.object === 'ball'){
         //host or techniican has modified the speed while the game is paused or reset - this prevents motion
         qbLastUpdate = Date.now();
         quizBallProcessMovement(data);
      }
   });


   socket.on('quizBallFreezeRequest', function(data){
      
      //currently 'neither' is not possible. One is always frozen
      if (data.frozen){
         qbFrozenSide = data.side;
         io.in('gameRoom').emit('quizBallFreezeUpdate', qbFrozenSide);
      }
      else{
         qbFrozenSide = (data.side === 'left')? 'right' : 'left';
         io.in('gameRoom').emit('quizBallFreezeUpdate', qbFrozenSide);
      }
      quizBallProcessMovement({'object': 'paddleFreeze', 'side': qbFrozenSide});
   });



//ends the 'conncetion' event (should be the BOTTOM)   
});



