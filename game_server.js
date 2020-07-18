var socket = require('socket.io');
var express = require('express');
var app = express();

//game global variables
var numPlayers = 0;
var names = [null, null, null, null];
var scores = [null, null, null, null];
var socketIDs = [null, null, null, null];
var ipAddresses = [null, null, null, null];
var hostSocketID = null;
var hostIpAddress = null;
var technicianSocketID = null;
var technicianIpAddress = null;
var socketTestTimesSent = [null, null, null, null]
var hostSocketTestTimeSent = [null]

// Shenanigans
var dancingPenguinReleased = false;


// Pass the Conch
var convoTimerStarted = null;
var convoTimerRemaining = null;
var convoTimer = null;
var silenceTimerStarted = null;
var silenceTimerAccumulated = null;

// Definitely Not Pictionary
var drawStuffTimerStarted = null;
var drawStuffCurrentPrompt = null;

// Quizball
var qbLastUpdate;
var qbGameState;
var qbData;
var qbMotionTimer;
var qbLastServerBroadcast;
var qbArrowKeysReversed;
const qbServerUpdatePeriod = 100;
const qbMotionPeriod = 30;
const paddleHeight = 74;
const paddleWidth = 15;
const quizBallCanvasWidth = 920;
const quizBallCanvasHeight = 464;
const qbBallRad = 9;
const leftPaddleColumn = 10;
const rightPaddleColumn = 895;

//Pitch the Product
var pitchRankings;
var pitchPlayerScores;
var pitchCombinedData;
const pitchScoresForEachPlace = [80, 65, 50, 35];
const pitchBonusScore = 50;
var pitchHostBonusRecipient;
var pitchTechnicianBonusRecipient;



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

//helper functions
function conchDebateOver(){
   var score = (silenceTimerAccumulated > 0)? Math.round((150*1000/silenceTimerAccumulated)*7) : 350;
   score = Math.min(score, 350);
   io.in('gameRoom').emit('conchConvoStop', score);
   io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| convo ended. Score: ' + score);
}
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
}
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

   //ball reached the left side of the screen
   else if (qbData.ballVelX < 0 && qbData.ballPosX - qbBallRad <= leftPaddleColumn + paddleWidth){
      //within the 'bounce buffer zone'
      if((qbData.ballPosY - 1.2*qbBallRad) < (qbData.leftPos + paddleHeight/2) && (qbData.ballPosY + 1.2*qbBallRad) > (qbData.leftPos - paddleHeight/2)){
         qbData.ballVelX = -1 * qbData.ballVelX;
         qbData.ballPosX = 2 * (leftPaddleColumn + paddleWidth + qbBallRad) - qbData.ballPosX;
      }
      else{
         quizBallServerDetectedGameOver('right');
         return;
      }
   }

   //ball reached the rigth side of the screen
   else if (qbData.ballVelX > 0 && qbData.ballPosX + qbBallRad >= rightPaddleColumn){
      //within the 'bounce buffer zone'
      if((qbData.ballPosY - 1.2*qbBallRad) < (qbData.rightPos + paddleHeight/2) && (qbData.ballPosY + 1.2*qbBallRad) > (qbData.rightPos - paddleHeight/2)){
         qbData.ballVelX = -1 * qbData.ballVelX;
         qbData.ballPosX = 2 * (rightPaddleColumn - qbBallRad) - qbData.ballPosX;
      }
      else{
         quizBallServerDetectedGameOver('left');
         return;
      }
   }


   if (overrides !== null){
      if (overrides.object === 'leftPaddle'){
         qbData.leftVel = (qbArrowKeysReversed)? -1*overrides.velocity: overrides.velocity;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received LEFT PADDLE override. Vel: ' + overrides.velocity);
      }
      else if (overrides.object === 'rightPaddle'){
         qbData.rightVel = (qbArrowKeysReversed)? -1*overrides.velocity: overrides.velocity;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received RIGHT PADDLE override. Vel: ' + overrides.velocity);
      }
      else if (overrides.object === 'ball'){
         qbData.ballSpeed = overrides.ballSpeed;
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received BALL SPEED override. ballSpeed: ' + overrides.ballSpeed);
      }
      else if (overrides.object === 'paddleFreeze'){
         qbData.frozenSide = overrides.side;
         if(overrides.side === 'left'){
            qbData.leftVel = 0;
         }
         else if (overrides.side === 'right'){
            qbData.rightVel = 0;
         }
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| received FREEZE override. frozenSide: ' + qbData.frozenSide);
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
   qbArrowKeysReversed = false;
   qbData = {
      'ballSpeed': 170,
      'ballPosX': 50,
      'ballPosY':  232,
      'ballVelX': Math.cos(Math.PI/4),
      'ballVelY': -Math.sin(Math.PI/4),
      'leftPos': 232,
      'leftVel': 0,
      'rightPos': 232,
      'rightVel': 0,
      'frozenSide': 'neither'   
   };
}
function quizBallServerDetectedGameOver(winner){
   clearInterval(qbMotionTimer);
   qbGameState = 'gameOver';
   io.in('gameRoom').emit('quizBallControlUpdate', qbGameState);
   io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
   io.in('gameRoom').emit('quizBallGameOver', winner);
   io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| game ended. Winner: ' + winner);
}
function pitchSortCombinedData(a, b){
   if (a[1] === b[1]){
       return 0;
   }
   else {
       return (a[1] > b[1])? -1 : 1;
   }
}


//creates the web socket
var io = socket(server);

//all of the socket functions
io.sockets.on('connection', function(socket){

   //when a new player joins the game
   socket.on('playerRequest', function (playerName){
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + playerName + " is attempting to join the game. SocketID: " +  socket.id + "... IP Address: " +   socket.request.connection.remoteAddress);
      if (numPlayers < 4){
         //might not be last slot that is empty (if some other user left)
         var idx = names.indexOf(null);
         if (idx != -1){
            numPlayers += 1;
            names[idx] = playerName;
            scores[idx] = 0;
            socketIDs[idx] = socket.id;
            ipAddresses[idx] =  socket.request.connection.remoteAddress;
         }
         else {
            io.to(technicianSocketID).emit('consoleDelivery', "|GAME SERVER| ERROR: failed to insert new player, but numPlayers < 4");
            return;
         }         
         socket.join('gameRoom');

         //broadcast player list to all clients (including the one that just connected)
         io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores,  "socketIDs": socketIDs});
         io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
      }
      else{
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + playerName + " attempted to join the game, but it is full. They are watching as an audience member.");
         
         socket.join('gameRoom');
         //send data only to the connecting audience member
         socket.emit('newObserver', {"numPlayers":numPlayers, "names": names, "scores": scores});
      }
   });

   //when an audience member joins the game, send the state info ONLY TO THAT CONNECTION
   socket.on('audienceRequest', function(data){
      io.to(technicianSocketID).emit('consoleDelivery', "|GAME SERVER| New audience member has joined the game.");
      socket.join('gameRoom');
      //send data only to the connecting audience member
      socket.emit('newObserver', {"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs});
   });

   socket.on('hostRequest', function(){
      hostSocketID = socket.id;
      hostIpAddress = socket.request.connection.remoteAddress;
      socket.join('gameRoom');
      socket.join('castMembers');
      socket.emit('newCastMember', packGameData());
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| host has entered the game');
   });

   socket.on('technicianRequest', function(){
      technicianSocketID = socket.id;
      technicianIpAddress = socket.request.connection.remoteAddress;
      socket.join('castMembers');
      socket.join('gameRoom');
      socket.emit('newCastMember', packGameData());
      io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| technician has entered the game');
   });

   socket.on('removePlayerRequest', function(badIdx){
      if (badIdx === "Host"){
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| Host has been removed from the game');
         io.to(hostSocketID).emit('playerHasBeenRemoved');
         hostSocketID = null;
         hostIpAddress = null;
      }
      else if (badIdx in [0,1,2,3]){
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| Player ' + (badIdx + 1) + ' (' + names[badIdx] + ") has been removed from the game. Their score was " + scores[badIdx]);
         io.to(socketIDs[badIdx]).emit('playerHasBeenRemoved');
         numPlayers -= 1;
         names[badIdx] = null;
         scores[badIdx] = null;
         socketIDs[badIdx] = null;
         ipAddresses[badIdx] = null;
         io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs});
      }
      else{
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ERROR: tried to remove player at index ' + badIdx);
      }
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
   });

   socket.on('gameDeployRequest', function(gameName){
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| Received game deploy request for ' + gameName);
      io.in('gameRoom').emit('gameDeploying', gameName);
      
      switch (gameName){
      
         case 'Quizball':
            resetQuizBallData();
            // KinematicsUpdate -> RegenerateGraphics on client
            io.in('gameRoom').emit('quizBallKinematicsUpdate', qbData);
            io.in('gameRoom').emit('quizBallControlUpdate', 'reset');
            break;
      
         case 'Pitch the Product':
            pitchRankings = [null, null, null, null];
            pitchPlayerScores = [0, 0, 0, 0];
            pitchCombinedData = [];
            pitchHostBonusRecipient = null;
            pitchTechnicianBonusRecipient = null;
            break;
      }  
   });

   socket.on('gameEndRequest', function(){
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| Received game end request');
      io.in('gameRoom').emit('gameEnded');
   });

   socket.on('messageRequest', function(data){
      io.to('castMembers').emit('messageDelivery', data);
   });

   socket.on('gameDataRequest', function(){
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| sending up to date server parameters to technician');
   });

   socket.on('nameChangeRequest', function(newNames){
      for (i = 0; i < 4; i++){
         if (names[i] !== newNames[i]){
            io.to(socketIDs[i]).emit('clientNameOverride', newNames[i]);
         }
      }
      names = newNames;
      io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores,  "socketIDs": socketIDs});
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
   });

   socket.on('scoreChangeRequest', function(newScores){
      scores = newScores;
      io.in('gameRoom').emit('playerScoresChanged', scores);
   });

   socket.on('playerImageChangeRequest', function(data){
      io.in('gameRoom').emit('playerImageHasChanged', data);
   });
   
   socket.on('castVisibilityRequest', function(data){
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| cast visbility request. member: ' + data.member + ', visibility: ' + data.visibility);
      io.in('gameRoom').emit('castVisibilityUpdate', data);
   })

   socket.on('technicianSoundRequest', function(soundName){
      io.in('gameRoom').emit('technicianSoundDelivery', soundName);
   });
   
   socket.on('technicianStopSoundRequest', function(){
      io.in('gameRoom').emit('technicianStopSoundDelivery');
   });

   socket.on('introMusicRequest', function(){
      io.in('gameRoom').emit('playIntroMusic');
   });

   socket.on('introMusicVolumeRequest', function(vol){
      io.in('gameRoom').emit('introMusicVolumeChange', vol);
   });

   socket.on('introScriptRequest', function(){
      io.to('castMembers').emit('scriptDelivery', "introductionScript");
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| introduction script deployed');
   });

   socket.on('technicianTestSocketsRequest', function(){
      for (i = 0; i < 4; i ++){
         if (names[i] !== null){
            socketTestTimesSent[i] = Date.now();
            io.to(socketIDs[i]).emit('testingSocketPing', {'socketID':socketIDs[i], 'playerID': i + 1, 'name': names[i]})
         }
      }
      hostSocketTestTimeSent = Date.now();
      io.to(hostSocketID).emit('testingSocketPing', {'socketID':hostSocketID, 'playerID': 'Host', 'name': 'HOST_NAME'});
      io.to(technicianSocketID).emit('consoleDelivery', '|CONTROL FRAMEWORK| sending out socket pings to clients');
   });

   socket.on('testingSocketResult', function(response){
      var duration = (response.playerID !== 'Host')? Date.now() - socketTestTimesSent[response.playerID - 1]: Date.now() - hostSocketTestTimeSent;
      io.to(technicianSocketID).emit('technicianSocketTestResults', {'playerID': response.playerID, 'status': response.status, 'responseTime': duration});
   });

   socket.on('leaveGame', function(departingPlayer){
      
      //if you were a player from the current server session
      if (numPlayers > 0 && socketIDs.indexOf(departingPlayer.socketID) !== -1){
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| ' + departingPlayer.name + " has left the game. playerID: " + departingPlayer.ID + ", score: " +  scores[departingPlayer.ID - 1] + ", socketID: " + departingPlayer.socketID);
         numPlayers -= 1;
         names[departingPlayer.ID - 1] = null;
         scores[departingPlayer.ID - 1] = null;
         socketIDs[departingPlayer.ID - 1] = null;
         ipAddresses[departingPlayer.ID - 1] = null;
         io.in('gameRoom').emit('playerListChanged', {"numPlayers":numPlayers, "names": names, "scores": scores, "socketIDs": socketIDs});
      }
      else if (departingPlayer.name === 'HOST_NAME' && departingPlayer.socketID === hostSocketID){
         hostSocketID = null;
         hostIpAddress = null;
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| host left the game. SocketID: ' + departingPlayer.socketID);
      }
      else if (departingPlayer.name === 'TECHNICIAN_GEOFF' && departingPlayer.socketID === technicianSocketID){
         technicianSocketID = null;
         technicianIpAddress = null;
      }
      else{
         io.to(technicianSocketID).emit('consoleDelivery', '|GAME SERVER| the following player was NOT part of the current session but pressed refresh.   Name: ' + departingPlayer.name + ",  playerID: " + departingPlayer.ID + ",  socketID: " + departingPlayer.socketID);
         return;
      }
      io.to(technicianSocketID).emit('gameDataDelivery', packGameData());
   });

   
   // Shenanigans
   socket.on('releaseDancingPenguinRequest', function(){
      dancingPenguinReleased = !dancingPenguinReleased;
      io.in("gameRoom").emit('releaseTheDancingPenguin', dancingPenguinReleased);
      io.to(technicianSocketID).emit('consoleDelivery', '|Shenanigans| dancing penguin released: ' + dancingPenguinReleased)
   });

   socket.on('reverseArrowKeyDirectionRequest', function(){
      qbArrowKeysReversed = !qbArrowKeysReversed;
      io.in('castMembers').emit('reverseArrowKeys', qbArrowKeysReversed);
      io.to(technicianSocketID).emit('consoleDelivery', '|Shenanigans| arrow keys reversed: ' + qbArrowKeysReversed)
   });

   socket.on('palletEnhancementRequest', function(data){
      io.in("gameRoom").emit('palletEnhancementChange', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|Shenanigans| draw stuff pallet enhanced: ' + data); 
   });

   socket.on('fredOverGrowlsRequest', function(data){
      io.in("gameRoom").emit('fredOverGrowlsChange', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|Shenanigans| Fred says hello over growls: ' + data);
   });

   // Pass the Conch
   socket.on('conchPromptRequest', function(topicData){
      convoTimerRemaining = 150*1000;
      silenceTimerAccumulated = 0;
      io.in('gameRoom').emit('conchPromptDisplay', topicData);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| question: ' + topicData.question + "... Left: " + topicData.leftStance + "... Right: " + topicData.rightStance);
   });
   socket.on('conchPlayerChangeRequest', function(data){
      io.in('gameRoom').emit('conchPlayersChanged', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| player change request. Left: ' + data.leftPlayerName + '... Right: ' + data.rightPlayerName);
   });

   socket.on('conchConvoStartRequest', function(){
      convoTimerStarted = Date.now();
      convoTimer = setTimeout(conchDebateOver, convoTimerRemaining);
      io.in('gameRoom').emit('conchConvoStart');
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| convo timer started. Timestamp: ' + convoTimerStarted);
   });

   socket.on('conchConvoPauseRequest', function(){      
      convoTimerRemaining -= Date.now() - convoTimerStarted
      clearTimeout(convoTimer);

      var mins = Math.floor(convoTimerRemaining/60000);
      var secs = Math.floor((convoTimerRemaining%60000)/1000);
      var remainingTimeString =  mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(convoTimerRemaining%1000/100);
      io.in('gameRoom').emit('conchConvoPause', {'timerString': remainingTimeString, 'remainingTime': convoTimerRemaining});
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| convo timer paused. Time remaining: ' +  remainingTimeString);         
   });

   socket.on('conchSilenceStartRequest', function(){
      silenceTimerStarted = Date.now()
      io.in('gameRoom').emit('conchSilenceStart', silenceTimerAccumulated);
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| silence timer resumed. Timestamp: ' + silenceTimerStarted +  '  Accumulated: ' + silenceTimerAccumulated);
   });

   socket.on('conchSilencePauseRequest', function(){
      silenceTimerAccumulated += Date.now() - silenceTimerStarted;
      var mins = Math.floor(silenceTimerAccumulated/60000);
      var secs = Math.floor((silenceTimerAccumulated%60000)/1000);
      io.in('gameRoom').emit('conchSilenceStop', mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(silenceTimerAccumulated%1000/100));
      io.to(technicianSocketID).emit('consoleDelivery', '|PASS THE CONCH| silence timer stopped. Silence Length:  ' + silenceTimerAccumulated);
   });


   // Guess That Growl
   socket.on('playAnimalNoiseRequest', function(animalName){
      io.in('gameRoom').emit('playAnimalNoise',  animalName);
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| animal noise requested: ' + animalName);
   });

   socket.on('showAnimalAnswerRequest', function(){
      io.in('gameRoom').emit('showAnimalAnswer');
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| cast requested to show the answer');
   });

   socket.on('clearAnimalAnswerRequest', function(){
      io.in('gameRoom').emit('clearAnimalAnswer');
      io.to(technicianSocketID).emit('consoleDelivery', '|GUESS THAT GROWL| cast requested to clear the answer (anmial game)');
   });


   // Definitely Not Pictionary
   socket.on('drawingPromptRequest', function(recData){
      drawStuffCurrentPrompt = recData.prompt;
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| artistID ' + recData.artistID + ' just received prompt: ' + recData.prompt);
      io.in('gameRoom').emit('showDrawingPrompt', recData);
   });

   socket.on('drawStuffStartRequest', function(){
      drawStuffTimerStarted = Date.now();
      io.in('gameRoom').emit('drawStuffStartTimer', drawStuffTimerStarted);
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| draw stuff timer started. Timestamp: ' + drawStuffTimerStarted);
   });

   socket.on('drawStuffMouseEvent', function(data){
      io.in('gameRoom').emit('drawStuffOnCanvas', data);
   });

   socket.on('drawStuffResetRequest', function(){
      io.in('gameRoom').emit('drawStuffResetGame');
   });

   socket.on('drawStuffCorrectGuessRequest', function(){
      io.in('gameRoom').emit('drawStuffCorrectStop', Date.now() - drawStuffTimerStarted);
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| stopping the clock because the answer was quessed correctly');
   });

   socket.on('drawStuffDisplayAnswerRequest', function(){
      io.in('gameRoom').emit('drawStuffDisplayAnswer', drawStuffCurrentPrompt);
      io.to(technicianSocketID).emit('consoleDelivery', '|DEFINITELY NOT PICTIONARY| displaing the answer: ' + drawStuffCurrentPrompt);
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
      if (data.object === "leftPaddle" && qbData.frozenSide === "left" || data.object === "rightPaddle" && qbData.frozenSide === "right"){
         io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| detected motion requests from frozen player');
         return;
      }

      clearInterval(qbMotionTimer);
      
      if (qbGameState === 'active'){
         quizBallProcessMovement(data);
         qbMotionTimer = setInterval(function(){quizBallProcessMovement(null);},  qbMotionPeriod);
      }
      else{
         //techniican modified the ball speed/which side is frozen while the game is paused or reset - this prevents motion
         qbLastUpdate = Date.now();
         quizBallProcessMovement(data);
      }
   });
   socket.on('quizBallChangeScoreRequest', function(data){
      io.in('gameRoom').emit('quizBallScoreUpdate', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|QUIZBALL| left score: ' + data.leftScore + ' ...  right score: ' + data.rightScore);
   });

   //Pitch the Product
   socket.on('pitchVideoControlRequest', function(command){
      io.in('gameRoom').emit('pitchVideoControlCommand', command);
   });

   socket.on('pitchCountdownStartRequest', function(){
      io.in('gameRoom').emit('pitchCountdownStart');
   });

   socket.on('pitchItemVisibilityRequest', function(data){
      io.in('gameRoom').emit('pitchItemVisibilityChange', data);
      io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| visibility modification. Item: ' + data.item + "... Visible: " + data.visible);
   });

   socket.on('pitchPlayerRankingsSubmission', function(data){
      pitchRankings[data.senderID - 1] = data.rankings;
      io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| ' + data.senderName + " submitted their rankings: " + data.rankings);
   });

   socket.on('pitchCastMemberBonusSubmission', function(data){
      pitchPlayerScores[names.indexOf(data.recipient)] += pitchBonusScore;
      io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| ' + data.name + " submitted their bonus reciptient: " + data.recipient);
   });

   socket.on('pitchScoreActionRequest', function(action){
      io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| score action request: ' + action);
      if (action === "computeAndDisplay"){
         for (i = 0; i < 4; i ++){
            if (pitchRankings[i] !== null){
               for(j = 0; j < numPlayers; j++){
                  pitchPlayerScores[names.indexOf(pitchRankings[i][j])] += pitchScoresForEachPlace[j];
               }
            }
         }

         for (i = 0; i < 4; i ++){
               if (names[i] !== null){
                  pitchCombinedData.push([names[i] , pitchPlayerScores[i]]);
               }
         }
         pitchCombinedData.sort(pitchSortCombinedData);

         io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| computed scores: ' + pitchCombinedData[0] + "; " + pitchCombinedData[1] + "; " + pitchCombinedData[2] + "; " + pitchCombinedData[3] + ";");
         io.in('gameRoom').emit('pitchShowScores', pitchCombinedData);
      }
      else if (action === "applyScores"){
         for (i = 0; i < numPlayers; i++){
           scores[names.indexOf(pitchCombinedData[i][0])] += pitchCombinedData[i][1];
         }
         io.in('gameRoom').emit('playerScoresChanged', scores);
         io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| new scores array: ' + scores);
      }
     
   });

   socket.on('pitchVideoBufferingFinishedRequest', function(recID){
      io.to(technicianSocketID).emit('consoleDelivery', '|PITCH PRODUCT| video has finished loading for ' + ([1,2,3,4].includes(recID))? names[recID - 1] : recID);
      io.in('gameRoom').emit('pitchVideoLoadedNotification', recID);
   });



//ends the 'conncetion' event (should be the BOTTOM)   
});



