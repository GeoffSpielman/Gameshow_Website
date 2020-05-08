var socket = io();
socket.on('playerListChanged', playerListChanged);
socket.on('newObserver', newObserver);
socket.on('newCastMember', newCastMember);
socket.on('messageDelivery', messageDelivery);
socket.on('gameDataDelivery', gameDataDelivery);
socket.on('playerScoresChanged', playerScoresChanged);
socket.on('consoleDelivery', consoleDelivery);
socket.on('gameDeploying', gameDeploying);
socket.on('gameEnded', gameEnded);
socket.on('conchPromptDisplay', conchPromptDisplay);
socket.on('conchConvoStart', conchConvoStart);
socket.on('conchConvoStop', conchConvoStop);
socket.on('conchSilenceStart', conchSilenceStart);
socket.on('conchSilenceStop', conchSilenceStop);
socket.on('playAnimalNoise', playAnimalNoise);
socket.on('technicianSoundDelivery', technicianSoundDelivery);
socket.on('technicianStopSoundDelivery', technicianStopSoundDelivery);
socket.on('showAnimalAnswer', showAnimalAnswer);
socket.on('clearAnimalAnswer', clearAnimalAnswer);
socket.on('toggleHostPic', toggleHostPic);
socket.on('showDrawingPrompt', showDrawingPrompt);
socket.on('drawStuffStartTimer', drawStuffStartTimer);
socket.on('drawOnCanvas', drawOnCanvas);
socket.on('drawStuffResetTimer', drawStuffResetTimer);
socket.on('quizBallSpeedUpdate', quizBallSpeedUpdate);
socket.on('quizBallShowPrompt', quizBallShowPrompt);
socket.on('quizBallPlayersChanged', quizBallPlayersChanged);

//state variables
var playerName = null;
var playerID = null;
var numPlayers = 0;
var allPlayerNames = [null, null, null, null];

//pass the conch
var convoTimer = null;
var convoTimerStarted = 0;
var silenceTimer = null;
var silenceTimerStarted = 0;
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


//useful lists of/references to HTML elements
var nametags;
var scoreBoxes;
var chatDisplayRegion;
var technicianNameBoxes;
var technicianScoreBoxes;
var technicianSocketCells;
var technicianIPcells;
var consoleDisplayRegion;
var technicianSounds;
var gameSelectionList;
var conchConvoTimerOutput;
var conchSilenceTimerOutput;
var drawStuffArtistBtns;
var drawStuffArtistLbls;
var drawStuffCanvas;
var ctx;
var quizBallPromptList;
var quizBallLeftPlayerSelect;
var quizBallRightPlayerSelect;
var quizBallCanvas;
var quizBallPaintbrush;





function pageFinishedLoading(){
    nametags = [document.getElementById("player1Name"),
                document.getElementById("player2Name"),
                document.getElementById("player3Name"), 
                document.getElementById("player4Name")];

    scoreBoxes = [document.getElementById("player1Score"),
                document.getElementById("player2Score"),
                document.getElementById("player3Score"), 
                document.getElementById("player4Score")];
    
    chatDisplayRegion = document.getElementById("messageHistory");

    technicianNameBoxes = [document.getElementById("player1NameTextBox"),
                            document.getElementById("player2NameTextBox"),
                            document.getElementById("player3NameTextBox"), 
                            document.getElementById("player4NameTextBox")];
    
    technicianScoreBoxes = [document.getElementById("player1ScoreTextBox"),
                            document.getElementById("player2ScoreTextBox"),
                            document.getElementById("player3ScoreTextBox"), 
                            document.getElementById("player4ScoreTextBox")];

    technicianSocketCells = [document.getElementById("player1SocketIDcell"),
                            document.getElementById("player2SocketIDcell"),
                            document.getElementById("player3SocketIDcell"),
                            document.getElementById("player4SocketIDcell")];
    
    technicianIPcells = [document.getElementById("player1IPcell"),
                        document.getElementById("player2IPcell"),
                        document.getElementById("player3IPcell"),
                        document.getElementById("player4IPcell")];

    consoleDisplayRegion = document.getElementById("consoleOutput");

    gameSelectionList =  document.getElementById('gameList');

    conchConvoTimerOutput = document.getElementById('convoTime');
    conchSilenceTimerOutput = document.getElementById('silenceTime');

    for (i = 0; i < 4; i++){
        technicianNameBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){modifyNamesClicked()}
        });
        technicianScoreBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){modifyScoresClicked()}
        });

    }

    technicianSounds = [document.getElementById("ApplauseLong"),
                        document.getElementById("CheerShort"),
                        document.getElementById("HornHonk"),
                        document.getElementById("Buzzer"),
                        document.getElementById("Ding"),
                        document.getElementById("SlideWhistle"),
                        document.getElementById("Punchline")];

    drawStuffArtistBtns = document.getElementsByName("artistRdBtn");
    
    drawStuffArtistLbls = [document.getElementById("artistLabel1"),
                        document.getElementById("artistLabel2"),
                        document.getElementById("artistLabel3"),
                        document.getElementById("artistLabel4")];

    drawStuffCanvas = document.getElementById("drawStuffCanvas");
    ctx = drawStuffCanvas.getContext("2d");

    quizBallPromptList = document.getElementById("quizBallQuestions");

    quizBallLeftPlayerSelect = document.getElementById("leftPlayerSelect");
    quizBallRightPlayerSelect = document.getElementById("rightPlayerSelect");
    quizBallCanvas = document.getElementById("quizBallCanvas");
    qBctx = quizBallCanvas.getContext("2d");



    //don't let the user go anywhere until everything above is done
    document.getElementById("joinButton").disabled = false;
    document.getElementById("observerButton").disabled = false;
    document.getElementById("garrettButton").disabled = false;
    document.getElementById("geoffButton").disabled = false;
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
    
    for (i = 0; i < 4; i ++){
        technicianNameBoxes[i].value = allPlayerNames[i];
        technicianScoreBoxes[i].value = recData.scores[i];
        technicianSocketCells[i].innerHTML = recData.socketIDs[i];
        technicianIPcells[i].innerHTML = recData.ipAddresses[i];
    }
    document.getElementById("hostSocketID").innerHTML = recData.hostSocketID;
    document.getElementById("hostIPaddress").innerHTML = recData.hostIpAddress;
    document.getElementById("technicianSocketID").innerHTML = recData.technicianSocketID;
    document.getElementById("technicianIPaddress").innerHTML = recData.technicianIpAddress;

}
function playerListChanged(data){
    var recData = JSON.parse(data);
    numPlayers = recData.numPlayers;
    allPlayerNames = recData.names;
    //iterate over ALL name tags (even if null), determine your id number
    for (i = 0; i < 4; i ++){
        nametags[i].innerHTML = allPlayerNames[i];
        if (allPlayerNames[i] === playerName)
        {
            playerID = i + 1;
        }
        scoreBoxes[i].innerHTML = recData.scores[i];
    }
    updatePlayerVisibility();
}
function playerScoresChanged(newScores){
    for (i = 0; i < 4; i ++){
        scoreBoxes[i].innerHTML = newScores[i];
    }
}
function newObserver(data){
    var recData = JSON.parse(data);

    //if the user was expecting to play and wasn't added to the list, alert them
    if  (playerName !== 'AUDIENCE_MEMBER' && recData.names.indexOf(playerName) === -1){
        alert("Unfortunately the game is full. You are now watching as an audience member")
        playerName = "AUDIENCE_MEMBER";
    }
    playerListChanged(data);
}
function newCastMember(data){
    var recData = JSON.parse(data);
    document.getElementById("hostHeader").style.display = "flex";
    document.getElementById("playerHeader").style.display = "none";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    
    playerListChanged(data);

    if (playerName === "TECHNICIAN_GEOFF"){
        playerID = "Technician"
        document.getElementById("gameRegion").style.display = "none";
        document.getElementById("technicianRegion").style.display = "flex";
        updateGameDataTable(recData);
    }
    else if (playerName === "HOST_GARRETT"){
        playerID = "Host"
    }
}
function messageDelivery(data){
    var recData = JSON.parse(data);
    var senderName;

    if (recData.sender === 'HOST_GARRETT'){
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
    chatDisplayRegion.scrollTop = chatDisplayRegion.scrollHeight;

}
function gameDataDelivery(data){
    updateGameDataTable(JSON.parse(data));
}
function consoleDelivery(message){
    var newMsg = document.createElement("li");
    newMsg.appendChild(document.createTextNode(message));
    document.getElementById('consoleOutput').appendChild(newMsg);
    consoleDisplayRegion.scrollTop = consoleDisplayRegion.scrollHeight;
}
function toggleHostPic(showOtherHostPic){
    document.getElementById("hostPic").src = (showOtherHostPic)? "./images/host_geoff.png" : "./images/host_garrett.png"
    document.getElementById("hostName").innerHTML = (showOtherHostPic)? "Host: Geoff" : "Host: Garrett"
}
function technicianSoundDelivery(soundName){
    document.getElementById(soundName).play();
}
function technicianStopSoundDelivery(){
    for (i = 0; i < technicianSounds.length; i ++){
        technicianSounds[i].pause();
        technicianSounds[i].currentTime = 0;
    }
}

//start game
function gameDeploying(gameName){
    
    //Pass the Conch
    document.getElementById('passConchGame').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('passConchSpecificContent').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('inputForSilenceTimer').style.display = (playerName === 'TECHNICIAN_GEOFF' && gameName === 'Pass the Conch')? 'flex' : 'none';
  
    //Name the Animal
    document.getElementById('nameAnimalGame').style.display = (gameName === 'Guess That Growl') ? 'flex' : 'none';
    document.getElementById('nameAnimalSpecificContent').style.display = (gameName === 'Guess That Growl') ? 'flex' : 'none';

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
        if(numPlayers > 0){
            var leftSelect = document.getElementById("leftPlayerSelect");
            var rightSelect = document.getElementById("rightPlayerSelect");
            for (i = 0; i < 4; i++){
                if(allPlayerNames[i] !== null){
                    var newLeftOption = document.createElement('option');
                    var newRightOption = document.createElement('option');
                    newLeftOption.text = allPlayerNames[i];
                    newRightOption.text = allPlayerNames[i];
                    leftSelect.add(newLeftOption);
                    rightSelect.add(newRightOption);
                }
            }
            document.getElementById('quizBallLeftPlayerName').innerHTML = leftSelect.options[leftSelect.selectedIndex].value;
            document.getElementById('quizBallRightPlayerName').innerHTML = rightSelect.options[rightSelect.selectedIndex].value;        
        }
        //document.addEventListener("keydown", quizBallKeyDown);
        //document.addEventListener("keyup", quizBallKeyUp);
       
        qBctx.fillStyle = 'red';
        qBctx.rect(10, 200, 15, 66);
        qBctx.fill();
        qBctx.lineWidth = 3;
        qBctx.strokeStyle = 'white';
        qBctx.stroke();
    }
}
//end game
function gameEnded(){
    //Pass the Conch
    document.getElementById('passConchGame').style.display = 'none';
    document.getElementById('passConchSpecificContent').style.display = 'none';
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    conchConvoTimerOutput.innerHTML = '00:00.0'
    conchSilenceTimerOutput.innerHTML = '00:00.0';
    document.getElementById("conchGamePromptBar").innerHTML = '';

    //Name the Animal
    document.getElementById('nameAnimalGame').style.display = 'none';
    document.getElementById('nameAnimalSpecificContent').style.display = 'none';
    document.getElementById("animalAnswerPicDiv").style.display = 'none';
    document.getElementById("animalNameDisplay").style.display = 'none';

    //Definitely Not Pictionary
    document.getElementById('drawStuffGame').style.display = 'none';
    document.getElementById('drawStuffSpecificContent').style.display = 'none';
    document.getElementById("drawStuffPromptArea").style.display = 'none';
    document.getElementById("drawStuffTitleArea").style.display = 'flex';
    document.getElementById("artistLabel").innerHTML = "Artist: ";

    //Quizball
    document.getElementById('quizBallGame').style.display = 'none';
    document.getElementById('quizBallSpecificContent').style.display = 'none';
    document.getElementById('leftPlayerSelect').options.length = 0;
    document.getElementById('rightPlayerSelect').options.length = 0;
    //document.removeEventListener("keydown", quizBallKeyDown);
    //document.removeEventListener("keyup", quizBallKeyUp);
}

//Pass the Conch
function conchPromptDisplay(promptText){
    document.getElementById("conchGamePromptBar").innerHTML = promptText;
    conchConvoTimerOutput.innerHTML = '00:00.0';
    conchSilenceTimerOutput.innerHTML = '00:00.0';
}
function updateConversationTimer(){
    var elapsedTime = Date.now() - convoTimerStarted;
    if(elapsedTime > 0){
        var secs = Math.floor((elapsedTime%60000)/1000);
        var mins = Math.floor(elapsedTime/60000);
        conchConvoTimerOutput.innerHTML =  (mins < 10? '0': '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(elapsedTime%1000/100);
    }
    else{
        conchConvoTimerOutput.innerHTML = '00:00.0'
    }
}
function updateSilenceTimer(){
    var elapsedTime = Date.now() - silenceTimerStarted + silenceTimerAccumulated;
    var secs = Math.floor((elapsedTime%60000)/1000);
    var mins = Math.floor(elapsedTime/60000);
    conchSilenceTimerOutput.innerHTML = (mins < 10? '0': '') + mins  + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(elapsedTime%1000/100);
}
function conchConvoStart(startTimeFromServer){
    convoTimerStarted = startTimeFromServer;
    clearInterval(convoTimer);
    convoTimer = setInterval(updateConversationTimer, 100);
    updateConversationTimer();
}
function conchConvoStop(data){
    var recData = JSON.parse(data);
    clearInterval(convoTimer);
    conchConvoTimerOutput.innerHTML = recData.timerString;
    document.getElementById("conchGamePromptBar").innerHTML = 'Score Awarded: ' + recData.scoreEarned; 
}
function conchSilenceStart(data){
    var recData = JSON.parse(data);
    silenceTimerStarted = recData.timerResumed;
    silenceTimerAccumulated = recData.timerAccumulated;
    clearInterval(silenceTimer);
    silenceTimer = setInterval(updateSilenceTimer, 100);
    updateSilenceTimer();
    silenceTimerRunning = true;
    document.getElementById('inputForSilenceTimer').style.backgroundColor = 'orange';
}
function conchSilenceStop(timeString){
    clearInterval(silenceTimer);
    conchSilenceTimerOutput.innerHTML = timeString;
    silenceTimerRunning = false;
    document.getElementById('inputForSilenceTimer').style.backgroundColor = 'white';
}

//Name the Animal
function playAnimalNoise(animalName){
    document.getElementById("animalAnswerPicDiv").style.display = 'none';
    document.getElementById("animalNameDisplay").style.display = 'none';
    
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
function showAnimalAnswer(){
    document.getElementById("animalAnswerPicDiv").style.display = 'block';
    document.getElementById("animalNameDisplay").style.display = 'block';
}
function clearAnimalAnswer(){
    document.getElementById("animalAnswerPicDiv").style.display = 'none';
    document.getElementById("animalNameDisplay").style.display = 'none';
}

// Definitely Not Pictionary
function showDrawingPrompt(data){
    var recData = JSON.parse(data);
    artistID = recData.artistID;
    if (artistID === playerID){
        document.getElementById("drawStuffTitleArea").style.display = 'none';
        document.getElementById("drawStuffPromptArea").style.display = 'flex';
        document.getElementById("drawStuffPrompt").innerHTML = recData.prompt;
    }
    else{
        document.getElementById("drawStuffPromptArea").style.display = 'none';
        document.getElementById("drawStuffTitleArea").style.display = 'flex';
        document.getElementById("artistLabel").innerHTML = "Artist: " + allPlayerNames[artistID - 1];
    }
    //clear all the radio buttons
    for (i = 0; i < 4; i++){
        drawStuffArtistBtns[i].checked = false;
    }
}
function updateDrawStuffTimer(){
    var remainingTime = 60*2000 - (Date.now() - drawStuffTimerStarted);
    var secs = Math.floor((remainingTime%60000)/1000);
    var mins = Math.floor(remainingTime/60000);
    if(remainingTime > 0){
        document.getElementById('drawStuffTimerOutput').innerHTML =  (mins < 10? '0': '') + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(remainingTime%1000/100);
    }
    else{
        document.getElementById('drawStuffTimerOutput').innerHTML = '00:00.0';
        document.getElementById('HornHonk').play();
        artistAllowedToDraw = false;
        clearInterval(drawStuffTimer);
    }
}
function drawStuffStartTimer(timerStartedFromServer){
    drawStuffTimerStarted = timerStartedFromServer;
    clearInterval(drawStuffTimer);
    drawStuffTimer = setInterval(updateDrawStuffTimer, 100);
    artistAllowedToDraw = true;
}
function drawOnCanvas(data){
    ctx.fillRect(data.x, data.y, 3, 3);
}
function drawStuffResetTimer(){
    clearInterval(drawStuffTimer);
    document.getElementById('drawStuffTimerOutput').innerHTML = '02:00.0';
    artistAllowedToDraw = false;
}

//Quizball.
function quizBallShowPrompt(promptString){
    document.getElementById('quizBallPrompt').innerHTML = promptString;
}
function quizBallSpeedUpdate(data){
    document.getElementById('quizBallSpeedInput').value = data;
}
function quizBallPlayersChanged(data){
    document.getElementById('quizBallLeftPlayerName').innerHTML = data.leftPlayer;
    document.getElementById('quizBallRightPlayerName').innerHTML = data.rightPlayer;
}





/*==== functions triggered by client actions/events ====*/
function clickedJoinGame(event){
    event.preventDefault();

    playerName = document.playerNameForm.playerNameInput.value;
    socket.emit('playerRequest', playerName)
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
}
function userAuthentication(attemptedRole){

    var urlParameters = new URLSearchParams(window.location.search);
    var role = urlParameters.get('role');

    if (attemptedRole === 'Garrett'){
        if (role === 'host'){
            playerName = 'HOST_GARRETT';
            socket.emit('hostRequest');
        }
        else{
            document.getElementById("authFailedPic").style.display = "block";
            document.getElementById("garrettButton").disabled = true;
            document.getElementById("garrettButton").style.background = "LightGrey";
        }
    }
    if (attemptedRole === 'Geoff'){
        if (role === 'technician'){
            playerName = 'TECHNICIAN_GEOFF';
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
    playerName = "AUDIENCE_MEMBER";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    socket.emit('audienceRequest')
}
function deployGameClicked(){
    if(gameSelectionList.selectedIndex === -1){
        alert("hey hot shot, why don't you select a game first?")
    }
    else{
        socket.emit('gameDeployRequest', gameSelectionList.options[gameSelectionList.selectedIndex].text)
    }
    document.getElementById('gameList').selectedIndex = -1;
}
function endGameClicked(){
    socket.emit('gameEndRequest');
}
function playerLeftGame(){
    playerInfo = JSON.stringify({"name":playerName, "number": playerID});
    socket.emit("leaveGame", playerInfo)
}

// Pass the Conch
function conchDeployPromptClicked(){
    var promptList = document.getElementById("conchTopics");
    if (promptList.selectedIndex === -1){
        alert("hey Dr. Smooth, you wanna select a prompt first?")
    }
    else{
        socket.emit('conchPromptRequest', promptList.options[promptList.selectedIndex].text);
        promptList.selectedIndex = -1;
    }
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
    var animalsList = document.getElementById("animalsList");
    if (animalsList.selectedIndex === -1){
        alert("Hey captain competent, how about you pick an animal first?")
    }
    else{
        socket.emit('playAnimalNoiseRequest', animalsList.options[animalsList.selectedIndex].text);
    }
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
    socket.emit('messageRequest', JSON.stringify({"sender": playerName, "message": document.getElementById("chatTextBox").value}));
    document.getElementById("chatTextBox").value = '';
}

//Definitely Not Pictionary
function drawStuffShowPromptClicked(){
    var promptList = document.getElementById("drawStuffList");
    
    if(promptList.selectedIndex === -1){
        alert("How about you select a prompt first ye WANKER?")
        return;
    }

    artistID = null;
    for (i = 0; i < 4; i++){
        if (drawStuffArtistBtns[i].checked){
            artistID = i + 1;
        }
    }

    if (artistID === null){
        alert("Oi Boy Wonder! how about you pick an artist first ya specky git?");
        return;
    }

    socket.emit('drawingPromptRequest', JSON.stringify({"artistID":artistID, "prompt": promptList.options[promptList.selectedIndex].text}));
    promptList.selectedIndex = -1;

}
function drawStuffStartTimerClicked(){
    socket.emit('drawStuffStartRequest');
}
function mouseMoveOnCanvas(){
    if (artistAllowedToDraw && (artistID === playerID) && (event.buttons === 1)){
        socket.emit('mouseDownMoveData', {'x':event.offsetX, 'y': event.offsetY});
    }
}
function drawStuffResetTimerClicked(){
    socket.emit('drawingResetRequest');
}


//Quizball
function quizBallQuestionChanged(){
    socket.emit('quizBallPromptRequest', quizBallPromptList.options[quizBallPromptList.selectedIndex].value);
}
function playerPaddleButtonClicked(paddleBtn){
    alert("paddle button clicked: " + paddleBtn)
}
function quizBallGameControlClicked(operation){
    socket.emit('quizBallControlRequest', operation);
}
function quizBallSpeedModified(speedChange){
    if (speedChange === 0 && event.keyCode === 13){
        
        socket.emit('quizBallSpeedRequest', {'changeType': 'overwrite', 'val': parseInt(document.getElementById('quizBallSpeedInput').value)});    
    }
    else if (speedChange === 1){
        socket.emit('quizBallSpeedRequest', {'changeType': 'modify', 'val': 5});    
    }
    else if (speedChange === -1){
        socket.emit('quizBallSpeedRequest', {'changeType': 'modify', 'val': -5});
    }
}
function quizBallPlayerSelectionsChanged(side){
    var data = {
        'leftPlayer':  quizBallLeftPlayerSelect.options[quizBallLeftPlayerSelect.selectedIndex].value,
        'rightPlayer': quizBallRightPlayerSelect.options[quizBallRightPlayerSelect.selectedIndex].value
    }; 
    socket.emit('quizBallPlayerChangeRequest', data);
}

function quizBallKeyDown(){
   if (event.keyCode === 38 && !upArrowPressed){
        upArrowPressed = true;
        document.getElementById("quizBallHeaderRow").style.backgroundColor = 'lime';
        
   }
   else if (event.keyCode === 40 && !downArrowPressed){
        downArrowPressed = true;
        document.getElementById("quizBallHeaderRow").style.backgroundColor = 'cyan';
   }
}

function quizBallKeyUp(){
    
    if (event.keyCode === 38){
        upArrowPressed = false;
    }
    else if (event.keyCode === 40){
        downArrowPressed = false;
    }
    alert("up pressed: " + upArrowPressed + "   down pressed: " + downArrowPressed);
    if (!upArrowPressed && !downArrowPressed){
        document.getElementById("quizBallHeaderRow").style.backgroundColor = '#282a2';
    }
}




// Technician Buttons
function requestDataClicked(){
    socket.emit('gameDataRequest')
}
function modifyNamesClicked(){
    var newNames = [null, null, null, null];
    for (i = 0; i < 4; i ++){
        if (technicianNameBoxes[i].value !== ''){
            newNames[i] = technicianNameBoxes[i].value;
        }
    }
    socket.emit('nameChangeRequest', newNames);
}
function modifyScoresClicked(){
    var newScores = [0,0,0,0];
    for (i = 0; i < 4; i ++){
        newScores[i] = technicianScoreBoxes[i].value;
    }
    socket.emit('scoreChangeRequest', newScores);
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


