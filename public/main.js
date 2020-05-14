var socket = io();
socket.on('playerListChanged', playerListChanged);
socket.on('newObserver', newObserver);
socket.on('newCastMember', newCastMember);
socket.on('messageDelivery', messageDelivery);
socket.on('gameDataDelivery', updateGameDataTable);
socket.on('playerScoresChanged', playerScoresChanged);
socket.on('clientNameOverride', clientNameOverride);
socket.on('consoleDelivery', consoleDelivery);
socket.on('gameDeploying', gameDeploying);
socket.on('gameEnded', gameEnded);
socket.on('testingSocketPing', testingSocketPing);
socket.on('conchPromptDisplay', conchPromptDisplay);
socket.on('conchConvoStart', conchConvoStart);
socket.on('conchConvoStop', conchConvoStop);
socket.on('conchSilenceStart', conchSilenceStart);
socket.on('conchSilenceStop', conchSilenceStop);
socket.on('playAnimalNoise', playAnimalNoise);
socket.on('technicianSoundDelivery', technicianSoundDelivery);
socket.on('technicianStopSoundDelivery', technicianStopSoundDelivery);
socket.on('technicianSocketTestResults', technicianSocketTestResults);
socket.on('showAnimalAnswer', showAnimalAnswer);
socket.on('clearAnimalAnswer', clearAnimalAnswer);
socket.on('toggleHostPic', toggleHostPic);
socket.on('castVisibilityUpdate', castVisibilityUpdate);
socket.on('showDrawingPrompt', showDrawingPrompt);
socket.on('drawStuffStartTimer', drawStuffStartTimer);
socket.on('drawOnCanvas', drawOnCanvas);
socket.on('drawStuffResetGame', drawStuffResetGame);
socket.on('quizBallShowPrompt', quizBallShowPrompt);
socket.on('quizBallPlayersChanged', quizBallPlayersChanged);
socket.on('quizBallControlUpdate', quizBallControlUpdate);
socket.on('quizBallKinematicsUpdate', quizBallKinematicsUpdate);
socket.on('quizBallFreezeUpdate', quizBallFreezeUpdate);
socket.on('quizBallGameOver', quizBallGameOver);

//state variables
var myName = null;
var myID = null;
var mySocketID = null;
var numPlayers = 0;
var allPlayerNames = [null, null, null, null];
var mySoundOn = true;
var scoreAwards = [0,0];

//pass the conch
var convoTimer = null;
var convoTimerStarted = 0;
var silenceTimer = null;
var silenceTimerResumed = 0;
var silenceTimerAccumulated = 0;
var silenceTimerRunning = false;

//definitely not pictionary
var artistID = null;
var drawStuffTimerStarted = 0;
var drawStuffTimer = null;
var artistAllowedToDraw = false;

//quizBall
var upArrowPressed = false;
var downArrowPressed = false;
var qbGameState = 'reset';
const paddleHeight = 74;
const paddleWidth = 15;
const maxPaddleSpeed = 100;
const quizBallCanvasWidth = 920;
const quizBallCanvasHeight = 464;
const qbInterpolationPeriod = 40;
const qbBallRad = 9;
const leftPaddleColumn = 10;
const rightPaddleColumn = 895;
var quizBallPlayerSide = null;
var qbFrozenSide;
var qbData;
var qbLastUpdate;
var qbInterpolationTimer;



//useful lists of/references to HTML elements
var nametags;
var scoreBoxes;
var technicianNameBoxes;
var technicianScoreBoxes;
var technicianSocketCells;
var technicianSocketStatusCells;
var technicianIPcells;
var technicianSounds;
var scoreAwardNameCells
var drawStuffArtistBtns;
var drawStuffArtistLbls;
var ctx;
var qbCanvas;
var quizBallPaintbrush;
var qbTechnicianOutputs;
var qbSpeedInputBox;



function pageFinishedLoading(){
    $("#playerNameTextbox").focus();
    
    nametags = [$("#player1Name"),
                $("#player2Name"),
                $("#player3Name"), 
                $("#player4Name")];

    scoreBoxes = [  $("#player1Score"),
                    $("#player2Score"),
                    $("#player3Score"), 
                    $("#player4Score")];

    technicianNameBoxes = $(".ttNameTextBox");
    technicianScoreBoxes = $(".ttScoreTextBox");
    technicianSocketCells = $(".ttSocketIdCell");
    technicianSocketStatusCells = $(".ttSocketStatusCell");
    technicianIPcells = $(".ttIPaddressCell");

    for (i = 0; i < 4; i++){
        technicianNameBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){nameModificationMade()}
        });
        technicianScoreBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){scoreModificationMade()}
        });

    }

    technicianSounds = $(".technicianSoundBoard");
    
    scoreAwardNameCells = $(".awardsPlayerNameCell");

    drawStuffArtistBtns = document.getElementsByName("artistRdBtn");
    
    drawStuffArtistLbls = $(".artistNameRdBtnLabel");

    ctx = $("#drawStuffCanvas")[0].getContext("2d");

    qbCanvas = document.getElementById("quizBallCanvas");
    qbCtx = qbCanvas.getContext("2d");

    qbTechnicianOutputs = {
        'updateAge': $("#qbUpdateAgeCell"),
        'gameState': $("#qbGameStateCell"),
        'ballSpeed': $("#qbBallSpeedCell"),
        'ballPosX': $("#qbBallPosXCell"),
        'ballPosY': $("#qbBallPosYCell"),
        'ballVelX': $("#qbBallVelXCell"),
        'ballVelY': $("#qbBallVelYCell"),  
        'leftPos': $("#qbLeftPosCell"),
        'leftVel': $("#qbLeftVelCell"),
        'rightPos': $("#qbRightPosCell"),
        'rightVel': $("#qbRightVelCell"),
        'frozenSide': $("#qbFrozenSideCell")};

    qbSpeedInputBox = document.getElementById('quizBallSpeedInput');


    //don't let the user go anywhere until everything above is done
    $("#joinButton").prop("disabled", false);
    $("#observerButton").prop("disabled", false);
    $("#garrettButton").prop("disabled", false);
    $("#geoffButton").prop("disabled", false);
}

/*==== functions triggered by socket events =====*/
function updatePlayerVisibility(){

    //player 1 and 3 present (left side only)
    if (allPlayerNames[0] !== null && allPlayerNames[2] !== null){
        document.getElementById("player1div").style.display = "flex";
        document.getElementById("player1div").style.height = "50%";
        document.getElementById("player3div").style.display = "flex";
        document.getElementById("player3div").style.height = "50%";
    }
    //only player 1 present (left side only)
    else if(allPlayerNames[0] !== null){
        document.getElementById("player3div").style.display = "none";
        document.getElementById("player1div").style.display = "flex";
        document.getElementById("player1div").style.height = "100%";
        
    }
    //only player 3 present (left side only)
    else if(allPlayerNames[2] !== null){
        document.getElementById("player1div").style.display = "none";
        document.getElementById("player3div").style.display = "flex";
        document.getElementById("player3div").style.height = "100%";
    }
    //neither player 1 nor 3 is present (left side only)
    else{
        document.getElementById("player1div").style.display = "none";
        document.getElementById("player3div").style.display = "none";
    }


    //player 2 and 4 present (right side only)
    if (allPlayerNames[1] !== null && allPlayerNames[3] !== null){
        document.getElementById("player2div").style.display = "flex";
        document.getElementById("player2div").style.height = "50%";
        document.getElementById("player4div").style.display = "flex";
        document.getElementById("player4div").style.height = "50%";
    }
    //only player 2 present (right side only)
    else if(allPlayerNames[1] !== null){
        document.getElementById("player4div").style.display = "none";
        document.getElementById("player2div").style.display = "flex";
        document.getElementById("player2div").style.height = "100%";
        
    }
    //only player 4 present (right side only)
    else if(allPlayerNames[3] !== null){
        document.getElementById("player2div").style.display = "none";
        document.getElementById("player4div").style.display = "flex";
        document.getElementById("player4div").style.height = "100%";
    }
    //neither player 2 nor 4 is present (right side only)
    else{
        document.getElementById("player2div").style.display = "none";
        document.getElementById("player4div").style.display = "none";
    }
}
function updateGameDataTable(recData){
    allPlayerNames = recData.names;
    document.getElementById("playerCount").innerHTML = 'numPlayers: ' + recData.numPlayers;

    for (i = 0; i < 4; i ++){
        technicianNameBoxes[i].value = allPlayerNames[i];
        scoreAwardNameCells[i].innerHTML = allPlayerNames[i];
        technicianScoreBoxes[i].value = recData.scores[i];
        technicianSocketCells[i].innerHTML = recData.socketIDs[i];
        technicianIPcells[i].innerHTML = recData.ipAddresses[i];
    }
    document.getElementById("hostSocketIDcell").innerHTML = recData.hostSocketID;
    document.getElementById("hostIPaddressCell").innerHTML = recData.hostIpAddress;
    document.getElementById("technicianSocketIDcell").innerHTML = recData.technicianSocketID;
    document.getElementById("technicianIPaddressCell").innerHTML = recData.technicianIpAddress;

}
function playerListChanged(recData){
    numPlayers = recData.numPlayers;
    document.getElementById("playerCount").innerHTML = 'numPlayers: ' + numPlayers;
    allPlayerNames = recData.names;
    //iterate over ALL name tags (even if null), determine your id number
    for (i = 0; i < 4; i ++){
        nametags[i].html(allPlayerNames[i]);
        if (allPlayerNames[i] === myName)
        {
            myID = i + 1;
            mySocketID = recData.socketIDs[i];
        }
        scoreBoxes[i].html(recData.scores[i]);
    }
    updatePlayerVisibility();
}
function playerScoresChanged(newScores){
    for (i = 0; i < 4; i ++){
        scoreBoxes[i].html(newScores[i]);
        technicianScoreBoxes[i].value = newScores[i];
    }
}
function clientNameOverride(newName){
    myName = newName;
}
function newObserver(recData){
    //if the user was expecting to play and wasn't added to the list, alert them
    if  (myName !== 'AUDIENCE_MEMBER' && recData.names.indexOf(myName) === -1){
        alert("Unfortunately the game is full. You are now watching as an audience member")
        myName = "AUDIENCE_MEMBER";    
    }
    myID = "AudMemId";
    mySocketID = "AudMemSocketID";
    playerListChanged(recData);
}
function newCastMember(recData){
    document.getElementById("hostHeader").style.display = "flex";
    document.getElementById("playerHeader").style.display = "none";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    
    playerListChanged(recData);

    if (myName === "TECHNICIAN_GEOFF"){
        myID = "Technician"
        mySocketID = recData.technicianSocketID;
        document.getElementById("gameRegion").style.display = "none";
        document.getElementById("technicianRegion").style.display = "flex";
        updateGameDataTable(recData);
    }
    else if (myName === "HOST_NAME"){
        myID = "Host"
        mySocketID = recData.hostSocketID;
    }
}
function messageDelivery(recData){
    var senderName;

    if (recData.sender === 'HOST_NAME'){
        senderName = 'Garrett';
    }
    else if (recData.sender === 'TECHNICIAN_GEOFF'){
        senderName = 'Geoff'
    }
    else{
        senderName = 'Unknown (ERROR)'
    }

    var newLi = document.createElement("li");
    var newBold = document.createElement("strong");
    newBold.append(document.createTextNode(senderName + ": "));
    newLi.appendChild(newBold);
    newLi.appendChild(document.createTextNode(recData.message));
    document.getElementById('messageList').appendChild(newLi);
    $("#messageHistory").scrollTop( $("#messageHistory").prop("scrollHeight"));
    

}
function consoleDelivery(message){
    var newMsg = document.createElement("li");
    newMsg.appendChild(document.createTextNode(message));
    document.getElementById('consoleOutput').appendChild(newMsg);
    $("#consoleArea").scrollTop( $("#consoleArea").prop("scrollHeight"));
}
function toggleHostPic(showOtherHostPic){
    document.getElementById("hostPic").src = (showOtherHostPic)? "./images/host_geoff.png" : "./images/host_garrett.png"
    document.getElementById("hostName").innerHTML = (showOtherHostPic)? "Host: Geoff" : "Host: Garrett"
}
function castVisibilityUpdate(data){
    if (data.member === 'host'){
        document.getElementById("hostDiv").style.visibility  = data.visibility;
    }
    else if (data.member === 'technician'){
        document.getElementById("technicianDiv").style.visibility  = data.visibility;
    }
}
function technicianSoundDelivery(soundName){
    if (mySoundOn){
        document.getElementById(soundName).play();
    }
}
function technicianStopSoundDelivery(){
    for (i = 0; i < technicianSounds.length; i ++){
        technicianSounds[i].pause();
        technicianSounds[i].currentTime = 0;
    }
}
function testingSocketPing(data){
    if(mySocketID === data.socketID && myID === data.playerID && myName === data.name){
        socket.emit('testingSocketResult', {'playerID': data.playerID, 'status':'good'});
    }
    else if (mySocketID !== data.socketID){
        socket.emit('testingSocketResult', {'playerID': data.playerID, 'status':'ERROR: Socket ID mismatch.  Client mySocketID: ' + mySocketID + '  Server socketID: ' + data.socketID});
    }
    else if (myID !== data.playerID){
        socket.emit('testingSocketResult', {'playerID': data.playerID, 'status':'ERROR: Player ID mismatch.  Client myID: ' + myID + '  Server playerID: ' + data.playerID});
    }
    else if (myName !== data.name){
        socket.emit('testingSocketResult', {'playerID': data.playerID, 'status':'ERROR: Player name mismatch.  Client myName: ' + myName + '  Server name: ' + data.name});
    }
}

function technicianSocketTestResults(response){
    if (response.status === 'good'){
        if (response.playerID !== 'Host'){
            technicianSocketStatusCells[response.playerID - 1].innerHTML = 'good';
        }
        else{
            document.getElementById("hostSocketStatusCell").innerHTML = 'good';
        }
    }
    else{
        if (response.playerID !== 'Host'){
            technicianSocketStatusCells[response.playerID - 1].innerHTML = 'error';
        }
        else{
            document.getElementById("hostSocketStatusCell").innerHTML = 'error';
        }
        var newMsg = document.createElement("li");
        newMsg.appendChild(document.createTextNode(response.status));
        document.getElementById('consoleOutput').appendChild(newMsg);
        $("#consoleArea").scrollTop( $("#consoleArea").prop("scrollHeight"));
    }
}

//start game
function gameDeploying(gameName){
    
    //Pass the Conch
    document.getElementById('passConchGame').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('passConchSpecificContent').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('inputForSilenceTimer').style.display = (myName === 'TECHNICIAN_GEOFF' && gameName === 'Pass the Conch')? 'flex' : 'none';

    //Name the Animal
    document.getElementById('nameAnimalGame').style.display = (gameName === 'Guess That Growl') ? 'flex' : 'none';
    document.getElementById('nameAnimalSpecificContent').style.display = (gameName === 'Guess That Growl') ? 'flex' : 'none';
    if (gameName === 'Guess That Growl'){
        for (i = 0; i < 4; i++){
            if(allPlayerNames[i] !== null){
                var newMsg = document.createElement("li");
                newMsg.appendChild(document.createTextNode(allPlayerNames[i]));
                $("#nameAnimalsTurnOrder").append(newMsg);
            }
        }
    }

    //Definitely Not Pictionary
    document.getElementById('drawStuffGame').style.display = (gameName === 'Definitely Not Pictionary') ? 'flex' : 'none';
    document.getElementById('drawStuffSpecificContent').style.display = (gameName === 'Definitely Not Pictionary') ? 'flex' : 'none';
    if(gameName === 'Definitely Not Pictionary'){
        for (i = 0; i < 4; i++){
            drawStuffArtistBtns[i].style.display = (allPlayerNames[i] === null)? 'none' : 'inline-block';
            if (allPlayerNames[i] === null){
                drawStuffArtistLbls[i].style.display = 'none';
            }
            else{
                drawStuffArtistLbls[i].innerHTML = allPlayerNames[i];
                drawStuffArtistLbls[i].style.display = 'inline-block';
            }
        }
    }

    //Quizball
    document.getElementById('quizBallGame').style.display = (gameName === 'Quizball') ? 'flex' : 'none';
    document.getElementById('quizBallSpecificContent').style.display = (gameName === 'Quizball') ? 'flex' : 'none';
    if(gameName === 'Quizball'){
        for (i = 0; i < 4; i++){
            if(allPlayerNames[i] !== null){
                var newLeftOption = document.createElement('option');
                var newRightOption = document.createElement('option');
                newLeftOption.text = allPlayerNames[i];
                newRightOption.text = allPlayerNames[i];
                $("#qbLeftPlayerSelect").append(newLeftOption);
                $("#qbRightPlayerSelect").append(newRightOption);
            }
        }
        document.getElementById('quizBallLeftPlayerName').innerHTML = $("#qbLeftPlayerSelect option:selected").text();
        document.getElementById('quizBallRightPlayerName').innerHTML = $("#qbRightPlayerSelect option:selected").text();
    }

    //score awards
    switch (gameName){
        case 'Pass the Conch':
            document.getElementById('awardACell').innerHTML = "Score Calculated by Game";
            break;

        case 'Guess That Growl':
            document.getElementById('awardACell').innerHTML = "Correct By Themself <br> 80 points";
            document.getElementById('awardBCell').innerHTML = "Correct with Help <br> 30 points";
            scoreAwards = [80, 30];
            break;

        case 'Definitely Not Pictionary':
            document.getElementById('awardACell').innerHTML = "Succesful Artist <br> 100 points";
            document.getElementById('awardBCell').innerHTML = "Correct Guess <br> 40 points";
            scoreAwards = [100, 40];
            break;

        case 'Quizball':
            document.getElementById('awardACell').innerHTML = "Winner <br> 100 points";
            document.getElementById('awardBCell').innerHTML = "Put Up a Good Fight <br> 30 points";
            scoreAwards = [100, 30];
            break;
    }
}
//end game
function gameEnded(){
    document.getElementById('awardACell').innerHTML = "---";
    document.getElementById('awardBCell').innerHTML = "---";
    scoreAwards = [0,0];

    
    //Pass the Conch
    document.getElementById('passConchGame').style.display = 'none';
    document.getElementById('passConchSpecificContent').style.display = 'none';
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    $("#conchConvoTimer").html('00:00.0')
    $("#conchSilenceTimer").html('00:00.0');
    document.getElementById("conchGamePromptBar").innerHTML = '';

    //Name the Animal
    document.getElementById('nameAnimalGame').style.display = 'none';
    document.getElementById('nameAnimalSpecificContent').style.display = 'none';
    document.getElementById("animalAnswerPicDiv").style.display = 'none';
    document.getElementById("animalNameDisplay").style.display = 'none';
    $("#nameAnimalsTurnOrder").empty();

    //Definitely Not Pictionary
    document.getElementById('drawStuffGame').style.display = 'none';
    document.getElementById('drawStuffSpecificContent').style.display = 'none';
    document.getElementById("drawStuffPromptArea").style.display = 'none';
    document.getElementById("drawStuffTitleArea").style.display = 'flex';
    document.getElementById("artistLabel").innerHTML = "Artist: ";

    //Quizball
    document.getElementById('quizBallGame').style.display = 'none';
    document.getElementById('quizBallSpecificContent').style.display = 'none';
    $("#qbLeftPlayerSelect").empty();
    $("#qbRightPlayerSelect").empty();
    document.removeEventListener("keydown", quizBallKeyDown);
    document.removeEventListener("keyup", quizBallKeyUp);
    socket.emit('quizBallControlRequest', 'reset');
}

//Pass the Conch
function conchPromptDisplay(promptText){
    document.getElementById("conchGamePromptBar").innerHTML = promptText;
    $("#conchConvoTimer").html('00:00.0');
    $("#conchSilenceTimer").html('00:00.0');
}
function updateConversationTimer(){
    var elapsedTime = Date.now() - convoTimerStarted;
    var secs = Math.floor((elapsedTime%60000)/1000);
    var mins = Math.floor(elapsedTime/60000);
    $("#conchConvoTimer").html((mins < 10? '0': '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(elapsedTime%1000/100));
}
function updateSilenceTimer(){
    var elapsedTime = Date.now() - silenceTimerResumed + silenceTimerAccumulated;
    var secs = Math.floor((elapsedTime%60000)/1000);
    var mins = Math.floor(elapsedTime/60000);
    $("#conchSilenceTimer").html((mins < 10? '0': '') + mins  + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(elapsedTime%1000/100));
}
function conchConvoStart(){
    convoTimerStarted = Date.now()
    clearInterval(convoTimer);
    convoTimer = setInterval(updateConversationTimer, 100);
    updateConversationTimer();
}
function conchConvoStop(recData){
    clearInterval(convoTimer);
    $("#conchConvoTimer").html(recData.timerString);
    document.getElementById("conchGamePromptBar").innerHTML = 'Score Awarded: ' + recData.scoreEarned; 
}
function conchSilenceStart(serverTimerAccumulated){
    silenceTimerResumed = Date.now();
    silenceTimerAccumulated = serverTimerAccumulated;
    clearInterval(silenceTimer);
    silenceTimer = setInterval(updateSilenceTimer, 100);
    updateSilenceTimer();
    silenceTimerRunning = true;
    document.getElementById('inputForSilenceTimer').style.backgroundColor = 'orange';
}
function conchSilenceStop(timeString){
    clearInterval(silenceTimer);
    $("#conchSilenceTimer").html(timeString);
    silenceTimerRunning = false;
    document.getElementById('inputForSilenceTimer').style.backgroundColor = 'white';
}

//Name the Animal
function playAnimalNoise(animalName){
    if (mySoundOn){
        switch (animalName){
            case "Canadian Goose":
                document.getElementById("gooseSound").play();
                document.getElementById("animalAnswerPic").src = "./images/canadianGoose.jpg"
                break;

            case "Blue Jay":
                document.getElementById("blueJaySound").play();
                document.getElementById("animalAnswerPic").src = "./images/blueJay.jpg"
                break;

            case "Camel":
                document.getElementById("camelSound").play();
                document.getElementById("animalAnswerPic").src = "./images/camel.jpg"
                break;
            
            case "Hippo":
                document.getElementById("hippoSound").play();
                document.getElementById("animalAnswerPic").src = "./images/hippo.jpg"
                break;

            case "Horse":
                document.getElementById("horseSound").play();
                document.getElementById("animalAnswerPic").src = "./images/horse.jpg"
                break;

            case "Penguin":
                document.getElementById("penguinSound").play();
                document.getElementById("animalAnswerPic").src = "./images/penguin.jpg"
                break;

            case "Sea Lion":
                document.getElementById("seaLionSound").play();
                document.getElementById("animalAnswerPic").src = "./images/seaLion.jpg"
                break;

            case "Squirrel":
                document.getElementById("squirrelSound").play();
                document.getElementById("animalAnswerPic").src = "./images/squirrel.jpg"
                break;

            case "Turkey":
                    document.getElementById("turkeySound").play();
                    document.getElementById("animalAnswerPic").src = "./images/turkey.jpg"
                    break;

            case "Groundhog":
                document.getElementById("groundhogSound").play();
                document.getElementById("animalAnswerPic").src = "./images/groundhog.jpg"
                break;

            case "Human Intercourse":
                document.getElementById("intercourseSound").play();
                document.getElementById("animalAnswerPic").src = "./images/pornHubLogo.png"
                break;

            default:
                alert("ERROR: unknown animal noise requested");
        }
        document.getElementById("animalNameDisplay").innerHTML = animalName;
    }
    
}
function showAnimalAnswer(){
    document.getElementById("animalAnswerPicDiv").style.display = 'block';
    document.getElementById("animalNameDisplay").style.display = 'block';
}
function clearAnimalAnswer(){
    document.getElementById("animalAnswerPicDiv").style.display = 'none';
    document.getElementById("animalNameDisplay").style.display = 'none';

    $("#nameAnimalsTurnOrder").prepend("<li>" + $("#nameAnimalsTurnOrder li:last-child").text() + "</li>");
    $("#nameAnimalsTurnOrder li:last-child").remove();
}

// Definitely Not Pictionary
function showDrawingPrompt(recData){
    artistID = parseInt(recData.artistID);
    if (artistID === myID){
        document.getElementById("drawStuffTitleArea").style.display = 'none';
        document.getElementById("drawStuffPromptArea").style.display = 'flex';
        document.getElementById("drawStuffPrompt").innerHTML = recData.prompt;
    }
    else{
        document.getElementById("drawStuffPromptArea").style.display = 'none';
        document.getElementById("drawStuffTitleArea").style.display = 'flex';
        document.getElementById("artistLabel").innerHTML = "Artist: " + allPlayerNames[artistID - 1];
    }
    
}
function updateDrawStuffTimer(){
    var remainingTime = 60*2000 - (Date.now() - drawStuffTimerStarted);
    var secs = Math.floor((remainingTime%60000)/1000);
    var mins = Math.floor(remainingTime/60000);
    if(remainingTime > 0){
        document.getElementById('drawStuffTimerOutput').innerHTML = mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(remainingTime%1000/100);
    }
    else{
        document.getElementById('drawStuffTimerOutput').innerHTML = '00:00.0';
        document.getElementById('HornHonk').play();
        artistAllowedToDraw = false;
        clearInterval(drawStuffTimer);
    }
}
function drawStuffStartTimer(){
    drawStuffTimerStarted = Date.now();
    clearInterval(drawStuffTimer);
    drawStuffTimer = setInterval(updateDrawStuffTimer, 100);
    artistAllowedToDraw = true;
}
function drawOnCanvas(data){
    ctx.fillRect(data.x, data.y, 3, 3);
}
function drawStuffResetGame(){
    clearInterval(drawStuffTimer);
    document.getElementById('drawStuffTimerOutput').innerHTML = '2:00.0';
    artistAllowedToDraw = false;
    ctx.clearRect(0, 0, 801, 381);
    ctx.beginPath();
    document.getElementById("drawStuffTitleArea").style.display = 'flex';
    document.getElementById("drawStuffPromptArea").style.display = 'none';
    document.getElementById("artistLabel").innerHTML = "Artist: ";
}

//Quizball
function quizBallShowPrompt(promptString){
    document.getElementById('quizBallPrompt').innerHTML = promptString;
}

function quizBallPlayersChanged(data){
    if (data.sideToChange === 'leftSide'){
        $('#quizBallLeftPlayerName').html(data.leftPlayerName);
        $("#qbLeftPlayerSelect").prop("selectedIndex", data.leftSelectedIndex);
    }
    else if (data.sideToChange === 'rightSide'){
        $('#quizBallRightPlayerName').html(data.rightPlayerName);
        $("#qbRightPlayerSelect").prop("selectedIndex", data.rightSelectedIndex);
    }
    
    if(data.leftPlayerName === myName){
        quizBallPlayerSide = 'left';
    }
    else if(data.rightPlayerName === myName){
        quizBallPlayerSide = 'right';
    }
    else{
        quizBallPlayerSide = null;
    }
}

function quizBallControlUpdate(newState){
    qbGameState = newState;
    qbTechnicianOutputs.gameState.innerHTML = newState;

    if (newState === 'active'){
        document.addEventListener("keydown", quizBallKeyDown);
        document.addEventListener("keyup", quizBallKeyUp);
        $("#qbLeftPlayerSelect").prop("disabled", true);
        $("#qbRightPlayerSelect").prop("disabled", true);
    }
    else{        
        clearInterval(qbInterpolationTimer);
        document.removeEventListener("keydown", quizBallKeyDown);
        document.removeEventListener("keyup", quizBallKeyUp); 

        if (newState === 'paused'){
            document.getElementById("quizBallStartButton").innerHTML = '<i class="material-icons">play_arrow</i><br>Resume Game';
        } 
        if (newState === 'reset'){
            document.getElementById("quizBallStartButton").innerHTML = '<i class="material-icons">play_arrow</i><br>Start Game';
            document.getElementById('quizBallPrompt').innerHTML = '';
            $("#qbLeftPlayerSelect").prop("disabled", false);
            $("#qbRightPlayerSelect").prop("disabled", false);
        }
    }
}

function outputKinematicsDataToTechnician(){
    qbTechnicianOutputs.updateAge.innerHTML = Date.now() - qbLastUpdate;
    qbTechnicianOutputs.ballSpeed.innerHTML = qbData.ballSpeed;
    qbTechnicianOutputs.ballPosX.innerHTML = qbData.ballPosX.toFixed(4);
    qbTechnicianOutputs.ballPosY.innerHTML = qbData.ballPosY.toFixed(4);
    qbTechnicianOutputs.ballVelX.innerHTML = qbData.ballVelX.toFixed(4);
    qbTechnicianOutputs.ballVelY.innerHTML = qbData.ballVelY.toFixed(4);
    qbTechnicianOutputs.leftPos.innerHTML = qbData.leftPos.toFixed(4);
    qbTechnicianOutputs.leftVel.innerHTML = qbData.leftVel.toFixed(4);
    qbTechnicianOutputs.rightPos.innerHTML = qbData.rightPos.toFixed(4);
    qbTechnicianOutputs.rightVel.innerHTML = qbData.rightVel.toFixed(4); 
}

function quizBallRegenerateGraphics(){
 
    qbCtx.clearRect(0, 0, quizBallCanvasWidth, quizBallCanvasHeight + 5);
    qbCtx.beginPath();
    
    qbCtx.fillStyle = (qbFrozenSide ==='left')? 'blue' : 'red';
    qbCtx.fillRect(leftPaddleColumn, qbData.leftPos - paddleHeight/2, paddleWidth, paddleHeight);
    qbCtx.fillStyle = (qbFrozenSide ==='right')? 'blue' : 'red';
    qbCtx.fillRect(rightPaddleColumn, qbData.rightPos - paddleHeight/2, paddleWidth, paddleHeight);
    
    qbCtx.fillStyle = 'white';
    qbCtx.arc(qbData.ballPosX, qbData.ballPosY, qbBallRad, 0, 2 * Math.PI);
    qbCtx.fill();
}

function quizBallInterpolateMotion(){
    deltaT = qbInterpolationPeriod/1000;
    qbData.leftPos += qbData.leftVel * deltaT;
    qbData.rightPos += qbData.rightVel * deltaT;
    qbData.ballPosX += qbData.ballVelX * qbData.ballSpeed * deltaT;
    qbData.ballPosY += qbData.ballVelY * qbData.ballSpeed * deltaT;

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

    
    if (myID === "Technician"){
        outputKinematicsDataToTechnician();
    }
    quizBallRegenerateGraphics();
}

function quizBallKinematicsUpdate(data){
    
    clearInterval(qbInterpolationTimer);
    qbData = data;

    if (document.activeElement !== qbSpeedInputBox){
        qbSpeedInputBox.value = qbData.ballSpeed;
    }    
    qbLastUpdate = Date.now();

    if (myID === "Technician"){
        outputKinematicsDataToTechnician();
    }
    if (qbGameState === 'active'){
        qbInterpolationTimer = setInterval(quizBallInterpolateMotion,  qbInterpolationPeriod);
    }
    quizBallRegenerateGraphics();
    
}

function quizBallFreezeUpdate(data){
    qbFrozenSide = data;
    qbTechnicianOutputs.frozenSide.innerHTML = qbFrozenSide;
}

function quizBallGameOver(winnerSide){
    qbCtx.font = "30px Arial";
    qbCtx.textAlign = "center";
    qbCtx.fillStyle = 'white';
    qbCtx.fillText("Game Over", quizBallCanvasWidth/2, quizBallCanvasHeight/2);
}




/*==== functions triggered by client actions/events ====
=========================================================*/
function clickedJoinGame(event){
    event.preventDefault();

    myName = document.playerNameForm.playerNameInput.value;
    socket.emit('playerRequest', myName)
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
}
function userAuthentication(attemptedRole){

    var urlParameters = new URLSearchParams(window.location.search);
    var role = urlParameters.get('role');

    if (attemptedRole === 'Garrett'){
        if (role === 'host'){
            myName = 'HOST_NAME';
            socket.emit('hostRequest');
        }
        else{
            document.getElementById("authFailedPic").style.display = "block";
            document.getElementById("garrettButton").disabled = true;
            document.getElementById("garrettButton").style.background = "LightGrey";
        }
    }
    else if (attemptedRole === 'Geoff'){
        if (role === 'technician'){
            myName = 'TECHNICIAN_GEOFF';
            socket.emit('technicianRequest');
        }
        else{
            document.getElementById("authFailedPic").style.display = "block";
            document.getElementById("geoffButton").disabled = true;
            document.getElementById("geoffButton").style.background = "LightGrey";
        }
    }    
}
function audienceMemberClicked(){
    myName = "AUDIENCE_MEMBER";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    socket.emit('audienceRequest')
}
function deployGameClicked(){
    socket.emit('gameDeployRequest',  $("#gameList option:selected").text());
}
function endGameClicked(){
    socket.emit('gameEndRequest');
}
function playerLeftGame(){
    socket.emit("leaveGame", {"name":myName, "ID": myID, 'socketID': mySocketID});
}

// Pass the Conch
function conchDeployPromptClicked(){
    socket.emit('conchPromptRequest', $("#conchTopics option:selected").text());
}
function conchConvoStartClicked(){
    socket.emit('conchConvoStartRequest');
}
function conchConvoStopClicked(){
    if(silenceTimerRunning){
        socket.emit('conchSilenceStopRequest');
    }
    socket.emit('conchConvoStopRequest');
}
function conchSilenceKeyPress(){
 
    if(silenceTimerRunning){
        socket.emit('conchSilenceStopRequest');
    }
    else{
        socket.emit('conchSilenceStartRequest');
    } 
}

// Name the Animal
function playAnimalNoiseClicked(){    
    socket.emit('playAnimalNoiseRequest', $("#animalsList option:selected").text());
}
function showAnimalAnswerClicked(){
    socket.emit('showAnimalAnswerRequest');
}
function clearAnimalAnswerClicked(){
    socket.emit('clearAnimalAnswerRequest');
}
function shenanigansButtonClicked(buttonName){
    alert("These haven't been implemented yet :(")
}
function sendMessageClicked(event){
    //prevents the page from being reloaded
    event.preventDefault();
    socket.emit('messageRequest', {"sender": myName, "message": $("#chatTextBox").val()});
    $("#chatTextBox").val('');
}

//Definitely Not Pictionary
function drawStuffShowPromptClicked(){
    socket.emit('drawingPromptRequest', {"artistID": $("input[name='artistRdBtn']:checked").val(), "prompt": $("#drawStuffList option:selected").text()});
}
function drawStuffStartTimerClicked(){
    socket.emit('drawStuffStartRequest');
}
function mouseMoveOnCanvas(){
    if (artistAllowedToDraw && (artistID === myID) && (event.buttons === 1)){
        socket.emit('mouseDownMoveData', {'x':event.offsetX, 'y': event.offsetY});
    }
}
function drawStuffResetGameClicked(){
    socket.emit('drawingResetRequest');
}


//Quizball
function quizBallQuestionChanged(){
    socket.emit('quizBallPromptRequest', $("#quizBallQuestionsList option:selected").text());
}

function quizBallFreezeButtonClicked(paddleString){

    switch (paddleString){
        case 'leftFreeze':
            socket.emit('quizBallFreezeRequest', {'side': 'left', 'frozen': true});
            break;
        case 'rightFreeze':
            socket.emit('quizBallFreezeRequest', {'side': 'right', 'frozen': true});
            break;

        case 'leftRelease':
            socket.emit('quizBallFreezeRequest', {'side': 'left', 'frozen': false});
            break;

        case 'rightRelease':
            socket.emit('quizBallFreezeRequest', {'side': 'right', 'frozen': false});
            break;
    }
}

function quizBallGameControlClicked(operation){
    if (operation === qbGameState){
        return;
    }

    if (operation === 'active'){
        var leftName = $("#qbLeftPlayerSelect option:selected").text();
        var rightName = $("#qbRightPlayerSelect option:selected").text();        

        if (leftName === rightName){
            alert("Hey wise guy, you've got a player playing against themself. Fix that chumbo!");
            return;
        }
        socket.emit('quizBallPlayerChangeRequest', {'sideToChange': 'neither', 'leftPlayerName': leftName, 'rightPlayerName': rightName});
    }
    socket.emit('quizBallControlRequest', operation);

}

function quizBallSpeedModified(speedChange){
    if (speedChange === 0 && event.keyCode === 13){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': parseInt(document.getElementById('quizBallSpeedInput').value)});    
    }
    else if (speedChange === 1){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': qbData.ballSpeed + 10});    
    }
    else if (speedChange === -1){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': qbData.ballSpeed - 10});
    }
}

function quizBallPlayerSelectionsChanged(side){
    var dataToSend = {
        'sideToChange': side,
        'leftPlayerName': $("#qbLeftPlayerSelect option:selected").text(),
        'leftSelectedIndex': $("#qbLeftPlayerSelect").prop("selectedIndex"),
        'rightPlayerName': $("#qbRightPlayerSelect option:selected").text(),
        'rightSelectedIndex': $("#qbRightPlayerSelect").prop("selectedIndex")}; 
    socket.emit('quizBallPlayerChangeRequest', dataToSend);
}

function quizBallKeyDown(){
   if (event.keyCode === 38 && !upArrowPressed){
        upArrowPressed = true;
        if(quizBallPlayerSide === 'left' && qbFrozenSide !== 'left'){
            qbData.leftVel = -1*maxPaddleSpeed;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'position': qbData.leftPos, 'velocity': qbData.leftVel});
        }
        else if (quizBallPlayerSide === 'right' && qbFrozenSide !== 'right'){
            qbData.rightVel = -1*maxPaddleSpeed;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'position': qbData.rightPos, 'velocity': qbData.rightVel});
        }   
   }
   else if (event.keyCode === 40 && !downArrowPressed){
        downArrowPressed = true;
        if(quizBallPlayerSide === 'left' && qbFrozenSide !== 'left'){
            qbData.leftVel = maxPaddleSpeed;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'position': qbData.leftPos, 'velocity': qbData.leftVel});
        }
        else if (quizBallPlayerSide === 'right'  && qbFrozenSide !== 'right'){
            qbData.rightVel = maxPaddleSpeed;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'position': qbData.rightPos, 'velocity': qbData.rightVel});
        }
   }  
}

function quizBallKeyUp(){
    
    if (event.keyCode === 38){
        upArrowPressed = false;
    }
    else if (event.keyCode === 40){
        downArrowPressed = false;
    }
    
    if (((event.keyCode === 38) || (event.keyCode === 40)) && !upArrowPressed && !downArrowPressed){
        if(quizBallPlayerSide === 'left'){
            qbData.leftVel = 0;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'position': qbData.leftPos, 'velocity': qbData.leftVel});
        }
        else if (quizBallPlayerSide === 'right'){
            qbData.rightVel = 0;
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'position': qbData.rightPos, 'velocity': qbData.rightVel});
        }
    }
}




// Technician Buttons
function requestDataClicked(){
    socket.emit('gameDataRequest')
}
function nameModificationMade(){
    var newNames = [null, null, null, null];
    for (i = 0; i < 4; i ++){
        if (technicianNameBoxes[i].value !== ''){
            newNames[i] = technicianNameBoxes[i].value;
        }
    }
    socket.emit('nameChangeRequest', newNames);
}
function scoreModificationMade(){
    var newScores = [0,0,0,0];
    for (i = 0; i < 4; i ++){
        newScores[i] = technicianScoreBoxes[i].value;
    }
    socket.emit('scoreChangeRequest', newScores);
}
function testSocketsClicked(){
    for (i = 0; i < numPlayers; i ++){
        technicianSocketStatusCells[i].innerHTML = "no response";
    }
    document.getElementById("hostSocketStatusCell").innerHTML = "no response";
    socket.emit('technicianTestSocketsRequest');
}
function ToggleHostClicked(){
    socket.emit('toggleHostPicRequest');
}
function technicianSoundClicked(soundName){
    socket.emit('technicianSoundRequest', soundName);
}
function technicianStopSoundClicked(){
    socket.emit('technicianStopSoundRequest');
}
function technicianToggleSoundClicked(){
    mySoundOn = !mySoundOn;
    document.getElementById("technicianSoundToggle").innerHTML = (mySoundOn)? "mySound: ON" : "mySound: OFF";
}

function castVisibilityClicked(castMember){
    if (castMember === 'host'){
        socket.emit('castVisibilityRequest', {'member': 'host', 'visibility': (document.getElementById("showHostCheckBox").checked)? 'visible': 'hidden'});
    }
    else if (castMember === 'technician'){
        socket.emit('castVisibilityRequest', {'member': 'technician', 'visibility': (document.getElementById("showTechnicianCheckBox").checked)? 'visible': 'hidden'});
    }
}

function awardScoreClicked(recData){    
    var newScores = [0,0,0,0];
    for (i = 0; i < 4; i ++){
        if (i === recData.playerIndex){
            newScores[i] = parseInt(technicianScoreBoxes[i].value) + (scoreAwards[parseInt(recData.awardIndex)] * recData.sign);
        }
        else{
            newScores[i] = parseInt(technicianScoreBoxes[i].value);
        }
    }
    socket.emit('scoreChangeRequest', newScores);
}




