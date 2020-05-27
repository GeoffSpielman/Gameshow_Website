var socket = io();
//game logistics
socket.on('playerListChanged', playerListChanged);
socket.on('clientNameOverride', clientNameOverride);
socket.on('newObserver', newObserver);
socket.on('newCastMember', newCastMember);
socket.on('messageDelivery', messageDelivery);
socket.on('gameDataDelivery', updateGameDataTable);
socket.on('playerScoresChanged', playerScoresChanged);
socket.on('playerImageHasChanged', playerImageHasChanged);
socket.on('consoleDelivery', consoleDelivery);
socket.on('gameDeploying', gameDeploying);
socket.on('gameEnded', gameEnded);
socket.on('testingSocketPing', testingSocketPing);
socket.on('technicianSocketTestResults', technicianSocketTestResults);
socket.on('castVisibilityUpdate', castVisibilityUpdate);
socket.on('playIntroMusic', playIntroMusic);
socket.on('scriptDelivery', scriptDelivery);

// Shenanigans
socket.on('releaseTheDancingPenguin', releaseTheDancingPenguin);
socket.on('reverseArrowKeys', reverseArrowKeys);

// Pass the Conch
socket.on('conchPromptDisplay', conchPromptDisplay);
socket.on('conchPlayersChanged', conchPlayersChanged);
socket.on('conchConvoStart', conchConvoStart);
socket.on('conchConvoPause', conchConvoPause);
socket.on('conchSilenceStart', conchSilenceStart);
socket.on('conchSilenceStop', conchSilenceStop);
socket.on('conchConvoStop', conchConvoStop);

// Guess That Growl
socket.on('playAnimalNoise', playAnimalNoise);
socket.on('technicianSoundDelivery', technicianSoundDelivery);
socket.on('technicianStopSoundDelivery', technicianStopSoundDelivery);
socket.on('showAnimalAnswer', showAnimalAnswer);
socket.on('clearAnimalAnswer', clearAnimalAnswer);

// Definitely Not Pictionary
socket.on('showDrawingPrompt', showDrawingPrompt);
socket.on('drawStuffStartTimer', drawStuffStartTimer);
socket.on('drawOnCanvas', drawOnCanvas);
socket.on('drawStuffResetGame', drawStuffResetGame);
socket.on('drawStuffCorrectStop', drawStuffCorrectStop);
socket.on('drawStuffDisplayAnswer', drawStuffDisplayAnswer);

// Quizball
socket.on('quizBallShowPrompt', quizBallShowPrompt);
socket.on('quizBallPlayersChanged', quizBallPlayersChanged);
socket.on('quizBallControlUpdate', quizBallControlUpdate);
socket.on('quizBallKinematicsUpdate', quizBallKinematicsUpdate);
socket.on('quizBallGameOver', quizBallGameOver);

// Pitch the Product
socket.on('pitchVideoControlCommand', pitchVideoControlCommand);
socket.on('pitchItemVisibilityChange', pitchItemVisibilityChange);
socket.on('pitchShowScores', pitchShowScores);
socket.on('pitchCountdownStart', pitchCountdownStart);



//state variables
var myName = null;
var myID = null;
var mySocketID = null;
var numPlayers = 0;
var allPlayerNames = [null, null, null, null];
var mySoundOn = true;
var scoreAwards = [0,0];
var playerPicOptions;
var hostPicOptions;

//shenanigans
var arrowKeysReversed = false;

//pass the conch
var convoTimer = null;
var convoTimerStarted = 0;
var convoTimerRemaining = null;
var silenceTimer = null;
var silenceTimerResumed = 0;
var silenceTimerAccumulated = 0;
var silenceTimerRunning = false;

//definitely not pictionary
var artistID = null;
var drawStuffTimerStarted = 0;
var drawStuffTimer = null;
var artistAllowedToDraw = false;
var drawStuffHintFlags = [0,0];

//quizBall
var upArrowPressed = false;
var downArrowPressed = false;
var qbGameState = 'reset';
var qbAutoFreezeOpponent = 'true';
const paddleHeight = 74;
const paddleWidth = 15;
const maxPaddleSpeed = 100;
const quizBallCanvasWidth = 920;
const quizBallCanvasHeight = 464;
const qbInterpolationPeriod = 30;
const qbBallRad = 10;
const leftPaddleColumn = 10;
const rightPaddleColumn = 895;
var quizBallPlayerSide = null;
var qbData;
var qbLastUpdate;
var qbInterpolationTimer;

//Pitch the Product
var pitchCountdownTimer;
var pitchCountdownStarted;



//useful lists of/references to HTML elements
var nametags;
var scoreBoxes;
var playerPicImages;
var technicianNameBoxes;
var technicianScoreBoxes;
var technicianPlayerImageSelects;
var technicianSocketCells;
var technicianSocketStatusCells;
var technicianIPcells;
var technicianSounds;
var themeMusic;
var scoreAwardNameCells
var drawStuffArtistBtns;
var drawStuffArtistLbls;
var drawStuffctx;
var qbCanvas;
var quizBallPaintbrush;
var qbTechnicianOutputs;
var qbSpeedInputBox;
var qbSpeedButtons;
var qbPaddleFreezeButtons;
var pitchProductRankingSelects;
var pitchProductRankingLabels;
var pitchProductResultsRows;
var pitchProductResultsNames;
var pitchProductResultsScores;



function pageFinishedLoading(){

    //configure these things depending on who's playing:
    
    $("#welcomeScreenNameBanner").html("Geoff and Garry’s Game Show Extravaganza!")
    $("#garrettButton").css("display", "inline-block");
    $("#gameNameInTopBar").html("Geoff and Garry’s Game Show Extravaganza!")
     
    playerPicOptions = [{'name': 'T Rex',       'picSRC': 't_rex.png',          'updateName': false},
                        {'name': 'Stegosaurus', 'picSRC': 'stego.png',          'updateName': false},
                        {'name': 'Triceratops', 'picSRC': 'tricera.png',        'updateName': false},
                        {'name': 'Pterodactly', 'picSRC': 'ptero.png',          'updateName': false},
                        {'name': 'MadeliMe',    'picSRC': 'madelime.png',       'updateName': true},
                        {'name': 'Mona Teresa', 'picSRC': 'monateresa.png',     'updateName': true},
                        {'name': 'ArMEGHANdon', 'picSRC': 'armeghandon.png',    'updateName': true},
                        {'name': 'SugarCHRISp', 'picSRC': 'sugarchrisp.png',    'updateName': true}]
    hostPicOptions =[   {'name': 'Geoff',       'picSRC': 'host_geoff.png',     'updateName': false},
                        {'name': 'Garrett',     'picSRC': 'host_garrett.png',   'updateName': false}]
    //==============================================================
    //==============================================================
   

    $("#playerNameTextbox").focus();
    
    nametags = [$("#player1Name"),
                $("#player2Name"),
                $("#player3Name"), 
                $("#player4Name")];

    scoreBoxes = [  $("#player1Score"),
                    $("#player2Score"),
                    $("#player3Score"), 
                    $("#player4Score")];

    playerPicImages = [$("#player1Image"), $("#player2Image"), $("#player3Image"), $("#player4Image")]; 

    technicianNameBoxes = $(".ttNameTextBox");
    technicianScoreBoxes = $(".ttScoreTextBox");
    technicianPlayerImageSelects = $(".playerImageSelect");
    technicianSocketCells = $(".ttSocketIdCell");
    technicianSocketStatusCells = $(".ttSocketStatusCell");
    technicianIPcells = $(".ttIPaddressCell");

    //fill in the techniican table
    for (i = 0; i < 4; i++){
        technicianNameBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){nameModificationMade()}
        });
        technicianScoreBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){scoreModificationMade()}
        });

        for (j = 0; j < playerPicOptions.length; j ++){
            var newOption = document.createElement('option');
            newOption.text = playerPicOptions[j].name;
            newOption.value = playerPicOptions[j].picSRC;
            technicianPlayerImageSelects[i].appendChild(newOption)
        }
        technicianPlayerImageSelects[i].selectedIndex = i;
    }
    for (i = 0; i < hostPicOptions.length; i++){
        newOption = document.createElement('option');
        newOption.text = hostPicOptions[i].name;
        newOption.value = hostPicOptions[i].picSRC;
        $("#hostImageSelect").append(newOption);
    }

    technicianSounds = $(".technicianSoundBoard");
    for(i = 0; i < technicianSounds.length; i ++){
        technicianSounds[i].volume = 0.3;
    }

    themeMusic = $(".music");
    for(i = 0; i < themeMusic.length; i ++){
        themeMusic[i].volume = 0.3;
    }
    
    scoreAwardNameCells = $(".awardsPlayerNameCell");

    drawStuffArtistBtns = document.getElementsByName("artistRdBtn");
    
    drawStuffArtistLbls = $(".artistNameRdBtnLabel");

    drawStuffctx = $("#drawStuffCanvas")[0].getContext("2d");

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
        'frozenSide': $("#qbFrozenSideCell"),
        'arrowsReversed': $("#qbArrowsReversedCell")};

    qbSpeedInputBox = $("#quizBallSpeedInput");
    qbSpeedButtons = $(".quizBallSpeedBtn");
    qbPaddleFreezeButtons = $(".playerPaddleButton");

    pitchProductRankingSelects = $(".pitchRankingSelect");
    pitchProductRankingLabels = $(".pitchRankingLabel");
    pitchProductResultsRows = $(".pitchResultsRow");
    pitchProductResultsNames = $(".pitchResultsNameCell");
    pitchProductResultsScores = $(".pitchResultsScoreCell");


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
        document.getElementById("player3div").style.display = "flex";  
    }
    //only player 1 present (left side only)
    else if(allPlayerNames[0] !== null){
        document.getElementById("player3div").style.display = "none";
        document.getElementById("player1div").style.display = "flex";
    }
    //only player 3 present (left side only)
    else if(allPlayerNames[2] !== null){
        document.getElementById("player1div").style.display = "none";
        document.getElementById("player3div").style.display = "flex";
    }
    //neither player 1 nor 3 is present (left side only)
    else{
        document.getElementById("player1div").style.display = "none";
        document.getElementById("player3div").style.display = "none";
    }


    //player 2 and 4 present (right side only)
    if (allPlayerNames[1] !== null && allPlayerNames[3] !== null){
        document.getElementById("player2div").style.display = "flex";
        document.getElementById("player4div").style.display = "flex";
    }
    //only player 2 present (right side only)
    else if(allPlayerNames[1] !== null){
        document.getElementById("player4div").style.display = "none";
        document.getElementById("player2div").style.display = "flex";        
    }
    //only player 4 present (right side only)
    else if(allPlayerNames[3] !== null){
        document.getElementById("player2div").style.display = "none";
        document.getElementById("player4div").style.display = "flex";
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
        technicianIPcells[i].innerHTML = (recData.ipAddresses[i] !== null && recData.ipAddresses[i].substr(0, 7) === "::ffff:")? recData.ipAddresses[i].substr(7) : recData.ipAddresses[i]
    }
    $("#hostSocketIDcell").html(recData.hostSocketID);
    $("#hostIPaddressCell").html((recData.hostIpAddress !== null && recData.hostIpAddress.substr(0,7) === "::ffff:")? recData.hostIpAddress.substr(7): recData.hostIpAddress)
    $("#technicianSocketIDcell").html(recData.technicianSocketID);
    $("#technicianIPaddressCell").html((recData.technicianIpAddress !== null && recData.technicianIpAddress.substr(0,7) === "::ffff:")? recData.technicianIpAddress.substr(7): recData.technicianIpAddress);

    //Compute the player matchups
    $("#playerMatchups").html("");
    for (i = 0; i < 4; i ++){
        if (allPlayerNames[i] === null){continue};
        for (j = i + 1; j < 4; j ++){
            if(allPlayerNames[j] === null){continue}
            var newMatchup = document.createElement("li");
            var checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.name = "playerMatchupsChkBx";
            newMatchup.appendChild(checkbox);
            newMatchup.appendChild(document.createTextNode(allPlayerNames[i] + " vs " + allPlayerNames[j]));
            $("#playerMatchups").append(newMatchup);
        }
    }
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
function clientNameOverride(newName){
    myName = newName;
}
function playerScoresChanged(newScores){
    for (i = 0; i < 4; i ++){
        scoreBoxes[i].html(newScores[i]);
        technicianScoreBoxes[i].value = newScores[i];
    }
}
function playerImageHasChanged(data){
    if (data.ID === "Host"){
        $("#hostPic").attr("src", "./images/" + hostPicOptions[data.selectedIndex].picSRC);
        $("#hostName").html("Host: " + hostPicOptions[data.selectedIndex].name);
    }
    else{
        playerPicImages[data.ID - 1].attr("src", "./images/" + playerPicOptions[data.selectedIndex].picSRC);  
    }
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
        mySoundOn = false;
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
    else if (recData.sender === 'Quizball'){
        senderName = 'Quizball'
    }
    else{
        senderName = 'Unknown (ERROR)'
    }

    var newLi = document.createElement("li");
    var newBold = document.createElement("strong");
    newBold.append(document.createTextNode(senderName + ": "));
    newLi.appendChild(newBold);
    newLi.appendChild(document.createTextNode(recData.message));
    $("#messageList").append(newLi);
    
    if (senderName === 'Quizball' && recData.link !== undefined){
        var linkLi = document.createElement("li");
        var linkItself = document.createElement("a");
        linkItself.textContent = recData.link;
        linkItself.setAttribute('href', recData.link);
        linkLi.appendChild(linkItself);
        $("#messageList").append(linkLi);
    }

    $("#messageHistory").scrollTop( $("#messageHistory").prop("scrollHeight"));
}
function consoleDelivery(message){
    var newMsg = document.createElement("li");
    newMsg.appendChild(document.createTextNode(message));
    document.getElementById('consoleOutput').appendChild(newMsg);
    $("#consoleArea").scrollTop( $("#consoleArea").prop("scrollHeight"));
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
    for (i = 0; i < themeMusic.length; i ++){
        themeMusic[i].pause();
        themeMusic[i].currentTime = 0;
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
            technicianSocketStatusCells[response.playerID - 1].innerHTML = 'good: ' + response.responseTime + 'ms';
        }
        else{
            $("#hostSocketStatusCell").html('good: ' + response.responseTime + 'ms');
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
function playIntroMusic(){
    if (mySoundOn){
        document.getElementById("introTheme").play();
    }
}
function scriptDelivery(scriptID){
    $("#messageList").append(document.getElementById(scriptID));
    $("#consoleArea").scrollTop( $("#consoleArea").prop("scrollHeight"));
}

// start game
function gameDeploying(gameName){
    
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
        if (mySoundOn){
            document.getElementById("definitelyNotPictionaryTheme").play();
        }
    }


    //Pass the Conch
    document.getElementById('passConchGame').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('passConchSpecificContent').style.display = (gameName === 'Pass the Conch') ? 'flex' : 'none';
    document.getElementById('inputForSilenceTimer').style.display = (myName === 'TECHNICIAN_GEOFF' && gameName === 'Pass the Conch')? 'flex' : 'none';
    $("#conchConvoStartBtn").prop("disabled", false);
    $("#conchConvoPauseBtn").prop("disabled", true);
    if (gameName === 'Pass the Conch'){
        var newLeftOption = document.createElement('option');
        var newRightOption = document.createElement('option');
        newLeftOption.text = "";
        newRightOption.text = "";
        $("#conchLeftPlayerSelect").append(newLeftOption);
        $("#conchRightPlayerSelect").append(newRightOption);
        for (i = 0; i < 4; i++){
            if(allPlayerNames[i] !== null){
                newLeftOption = document.createElement('option');
                newRightOption = document.createElement('option');
                newLeftOption.text = allPlayerNames[i];
                newRightOption.text = allPlayerNames[i];
                $("#conchLeftPlayerSelect").append(newLeftOption);
                $("#conchRightPlayerSelect").append(newRightOption);
            }
        }
        if (mySoundOn){
            document.getElementById("passTheConchTheme").play();
        }
    }

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
        if (mySoundOn){
            document.getElementById("guessThatGrowlTheme").play();
        }
    }

    //Quizball
    $("#quizBallGame").css("display", (gameName === 'Quizball') ? "flex" : "none");
    $("#quizBallSpecificContent").css("display", (gameName === 'Quizball') ? "flex" : "none");
    $("#quizBallControlsRow").css("display", (myName === "HOST_NAME")? "none": "flex");
    
    if(gameName === 'Quizball'){
        $("#qbLeftPlayerSelect").append(document.createElement('option'));
        $("#qbRightPlayerSelect").append(document.createElement('option'));
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
        if (mySoundOn){
            document.getElementById("quizballTheme").play();
        }
    }

    //Pitch the Product
    document.getElementById('pitchProductGame').style.display = (gameName === 'Pitch the Product') ? 'flex' : 'none';
    document.getElementById('pitchProductSpecificContent').style.display = (gameName === 'Pitch the Product') ? 'flex' : 'none';
    if (gameName === 'Pitch the Product'){
        for (i = 0; i < 4; i++){
            if(allPlayerNames[i] !== null){
                for (j = 0; j < pitchProductRankingSelects.length; j++){
                    var newOption = document.createElement('option')
                    newOption.text = allPlayerNames[i]
                    pitchProductRankingSelects[j].append(newOption)
                }
                var newHostOption = document.createElement('option');
                var newTechniicianOption = document.createElement('option');
                newHostOption.text = allPlayerNames[i];
                newTechniicianOption.text = allPlayerNames[i]
                $("#pitchHostBonus").append(newHostOption);
                $("#pitchTechnicianBonus").append(newTechniicianOption);
            }
        }
        $("#pitchHostBonusesRow").css("display", (myName === "HOST_NAME")? "flex": "none");
        $("#pitchTechnicianBonusesRow").css("display", (myName === "TECHNICIAN_GEOFF")? "flex": "none");
        if (mySoundOn){
            document.getElementById("pitchProductTheme").play();
        }
    }

    //score awards and scripts
    switch (gameName){
        case 'Definitely Not Pictionary':
            $("#awardADescriptionCell").html("Succesful Artist");
            $("#awardBDescriptionCell").html("Correct Guess");
            scoreAwards = [100, 40];
            $("#messageList").append($("#drawStuffScript"));
            break;
    
        case 'Pass the Conch':
            $("#awardADescriptionCell").html("Score Calculated by Game");
            $("#awardBDescriptionCell").html("Debate Winner Bonus")
            scoreAwards = ["TBD", 30];
            $("#messageList").append($("#passConchScript"));
            break;

        case 'Guess That Growl':
            $("#awardADescriptionCell").html("Locked in Correct Guess");
            $("#awardBDescriptionCell").html("Deferred Correct Answer");
            scoreAwards = [80, 30];
            $("#messageList").append($("#animalNoisesScript"));
            break;

        case 'Quizball':
            $("#awardADescriptionCell").html("Winner");
            $("#awardBDescriptionCell").html("Put Up Good Fight");
            scoreAwards = [100, 30];
            $("#messageList").append($("#quizBallScript"));
            break;
        
        case 'Pitch the Product':
            $("#awardADescriptionCell").html("1st, 2nd, 3rd, 4th");
            $("#awardBDescriptionCell").html("Cast Bonus");
            scoreAwards = ["80, 65, 50, 35", "50"];
            $("#messageList").append($("#pitchProductScript"));
            break;
    }
    $("#awardAPointsCell").html(scoreAwards[0] + " points");
    $("#awardBPointsCell").html(scoreAwards[1] + " points");
}
// end game
function gameEnded(){
    $("#awardADescriptionCell").html( "---");
    $("#awardBDescriptionCell").html("---");
    scoreAwards = [0,0];
    $("[name='playerMatchupsChkBx']").prop("checked", false);

    
    //Pass the Conch
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    $("#passConchGame").hide();
    $("#passConchSpecificContent").hide();
    $("#conchConvoTimer").html('2:30.0')
    $("#conchStallTimer").html('0:00.0');
    $("#conchTopQuestionArea").html("");
    $("#debateLeftStanceName").html("");
    $("#debateLeftStanceText").html("");
    $("#debateRightStanceName").html("");
    $("#debateRightStanceText").html("");
    $("#conchLeftPlayerSelect").empty();
    $("#conchRightPlayerSelect").empty();

    //Name the Animal
    $("#nameAnimalGame").hide();
    $("#nameAnimalSpecificContent").hide();
    $("#animalAnswerPicDiv").hide();
    $("#animalNameDisplay").hide();
    $("#nameAnimalsTurnOrder").empty();

    //Definitely Not Pictionary
    $("#drawStuffGame").hide();
    $("#drawStuffSpecificContent").hide();
    $("#drawStuffPromptArea").hide()
    $("#drawStuffTitleArea").css("display", "flex");
    $("#artistLabel").html("Artist: ");

    //Quizball
    $("#quizBallGame").hide();
    $("#quizBallSpecificContent").hide();
    $("#qbLeftPlayerSelect").empty();
    $("#qbRightPlayerSelect").empty();
    document.removeEventListener("keydown", quizBallKeyDown);
    document.removeEventListener("keyup", quizBallKeyUp);
    quizBallTechnicianControlsLock(false);

    //Pitch the Product
    $("#pitchProductGame").hide();
    $("#pitchProductSpecificContent").hide();
    $("#YouTubeVisibilityChk").prop("checked", false);
    $("#rankingVisibilityChk").prop("checked", false)
    $("#playerRankingColumn").css("display", "none");
    $("#pitchTitleRight").css("visibility", "hidden");
    $("#pitchSubmitRankingsBtn").prop("disabled", false);
    $("#videoParentDiv").css("display", "block");
    $("#pitchResultsDisplayArea").css("display", "none");
    for (i = 0; i < pitchProductRankingSelects.length; i++){
        pitchProductRankingSelects[i].innerHTML = "";
    }
    $("#pitchHostBonus").empty();
    $("#pitchTechnicianBonus").empty();
    $("#pitchHostSubmitBtn").prop("disabled", false);
    $("#pitchTechnicianSubmitBtn").prop("disabled", false);
    $("#rankingsErrorMessage").html("");
}

// Shenanigans
function releaseTheDancingPenguin(penguinReleased){
    if (penguinReleased){
        $("#dancingPenguinButton").html("Hide Dancing Penguin");
        var oldPic = $("#dancingPenguinPic")[0];
        var newPic = oldPic.cloneNode(true);
        oldPic.parentNode.replaceChild(newPic, oldPic);
        $("#dancingPenguinPic").css("display", "block");
    }
    else{
        $("#dancingPenguinButton").html("Release Dancing Penguin")
        $("#dancingPenguinPic").hide();
        if (mySoundOn){
            $("#PenguinSpotted")[0].play();
        }
    }
}
function reverseArrowKeys(reversed){
    arrowKeysReversed = reversed;
    $("#arrowKeysReversedButton").html((reversed)? "Return Arrow Keys to Normal" : "Reverse Arrow Key Directions");
    qbTechnicianOutputs.arrowsReversed.html(arrowKeysReversed.toString());
}

// Pass the Conch
function conchPromptDisplay(topicData){
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    $("#conchTopQuestionArea").html(topicData.question);
    $("#debateLeftStanceText").html(topicData.leftStance);
    $("#debateRightStanceText").html(topicData.rightStance);


    $("#conchLeftPlayerSelect").prop("selectedIndex", 0);
    $("#conchRightPlayerSelect").prop("selectedIndex", 0);
    $("#debateLeftStanceName").html("");
    $("#debateRightStanceName").html("");

    convoTimerRemaining = 150*1000;
    $("#conchConvoTimer").html('2:30.0');
    $("#conchStallTimer").html('0:00.0');
    $("#conchConvoStartBtn").prop("disabled", false);
    $("#conchConvoPauseBtn").prop("disabled", true);
    $("#conchLeftPlayerSelect").prop("disabled", false);
    $("#conchRightPlayerSelect").prop("disabled", false);
}
function conchPlayersChanged(data){
    if (data.sideToChange === "leftSide"){
        $("#debateLeftStanceName").html(data.leftPlayerName);
        $("#conchLeftPlayerSelect").prop("selectedIndex", data.leftSelectedIndex);
    }
    else if (data.sideToChange === "rightSide"){
        $("#debateRightStanceName").html(data.rightPlayerName);
        $("#conchRightPlayerSelect").prop("selectedIndex", data.rightSelectedIndex);
    }
}
function updateConversationTimer(){
    var timeToShow = convoTimerRemaining - (Date.now() - convoTimerStarted);
    if (timeToShow <= 0){
        clearInterval(convoTimer);
        clearInterval(silenceTimer);
        $("#conchConvoTimer").html('0:00.0');
    }
    else{
        var secs = Math.floor((timeToShow%60000)/1000);
        var mins = Math.floor(timeToShow/60000);
        $("#conchConvoTimer").html(mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(timeToShow%1000/100));
    }
    
}
function updateSilenceTimer(){
    var elapsedTime = Date.now() - silenceTimerResumed + silenceTimerAccumulated;
    var secs = Math.floor((elapsedTime%60000)/1000);
    var mins = Math.floor(elapsedTime/60000);
    $("#conchStallTimer").html(mins  + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(elapsedTime%1000/100));
}
function conchConvoStart(){
    convoTimerStarted = Date.now()
    clearInterval(convoTimer);
    convoTimer = setInterval(updateConversationTimer, 100);
    updateConversationTimer();
    $("#conchConvoStartBtn").prop("disabled", true);
    $("#conchConvoPauseBtn").prop("disabled", false);
    $("#conchLeftPlayerSelect").prop("disabled", true);
    $("#conchRightPlayerSelect").prop("disabled", true);
}
function conchConvoPause(data){
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    convoTimerRemaining = data.remainingTime;
    $("#conchConvoTimer").html(data.timerString);
    $("#conchConvoStartBtn").prop("disabled", false);
    $("#conchConvoPauseBtn").prop("disabled", true);
}
function conchConvoStop(score){
    clearInterval(convoTimer);
    clearInterval(silenceTimer);
    $("#conchConvoTimer").html('0:00.0');
    if (mySoundOn){
        $("#HornHonk")[0].play();
    }
    $("#conchTopQuestionArea").html('Score Awarded: ' + score);
    scoreAwards[0] = parseInt(score);
    $("#awardAPointsCell").html(scoreAwards[0] + " points");
}
function conchSilenceStart(serverTimerAccumulated){
    silenceTimerResumed = Date.now();
    silenceTimerAccumulated = serverTimerAccumulated;
    clearInterval(silenceTimer);
    silenceTimer = setInterval(updateSilenceTimer, 100);
    updateSilenceTimer();
    silenceTimerRunning = true;
    $("#inputForSilenceTimer").css("backgroundColor", "orange");
}
function conchSilenceStop(timeString){
    clearInterval(silenceTimer);
    $("#conchStallTimer").html(timeString);
    silenceTimerRunning = false;
    $("#inputForSilenceTimer").css("backgroundColor", "white");
}

// Guess That Growl
function playAnimalNoise(animalName){
    var acceptableAnswers;
    var soundToPlay;

    switch (animalName){
        case "Canadian Goose":
            soundToPlay = $("#gooseSound")[0];
            $("#animalAnswerPic").attr("src", "./images/canadianGoose.jpg");
            acceptableAnswers = "canadian goose, goose";
            break;

        case "Blue Jay":
            soundToPlay = $("#blueJaySound")[0];
            $("#animalAnswerPic").attr("src", "./images/blueJay.jpg");
            acceptableAnswers = "blue jay";
            break;

        case "Camel":
            soundToPlay = $("#camelSound")[0];
            $("#animalAnswerPic").attr("src", "./images/camel.jpg");
            acceptableAnswers = "camel";
            break;
        
        case "Hippo":
            soundToPlay = $("#hippoSound")[0];
            $("#animalAnswerPic").attr("src", "./images/hippo.jpg");
            acceptableAnswers = "hippo";
            break;

        case "Horse":
            soundToPlay = $("#horseSound")[0];
            $("#animalAnswerPic").attr("src", "./images/horse.jpg");
            acceptableAnswers = "horse, pony, unicorn";
            break;

        case "Penguin":
            soundToPlay = $("#penguinSound")[0];
            $("#animalAnswerPic").attr("src", "./images/penguin.jpg");
            acceptableAnswers = "penguin. Emperor penguin: 30 points";
            break;

        case "Sea Lion":
            soundToPlay = $("#seaLionSound")[0];
            $("#animalAnswerPic").attr("src", "./images/seaLion.jpg");
            acceptableAnswers = "sea lion, seal";
            break;

        case "Squirrel":
            soundToPlay = $("#squirrelSound")[0];
            $("#animalAnswerPic").attr("src", "./images/squirrel.jpg");
            acceptableAnswers = "squirrel, chipmunk";
            break;

        case "Turkey":
            soundToPlay = $("#turkeySound")[0];
            $("#animalAnswerPic").attr("src", "./images/turkey.jpg");
            acceptableAnswers = "turkey, wild turkey";
            break;

        case "Groundhog":
            soundToPlay = $("#groundhogSound")[0];
            $("#animalAnswerPic").attr("src", "./images/groundhog.jpg");
            acceptableAnswers = "groundhog, prarie dog, marmot";
            break;

        case "Human Intercourse":
            soundToPlay = $("#intercourseSound")[0];
            $("#animalAnswerPic").attr("src", "./images/pornHubLogo.png");
            acceptableAnswers = "human intercourse, blow job, sex";
            break;

        case "Human Intercourse (extended)":
            soundToPlay = $("#intercourseRevealSound")[0];
            $("#animalAnswerPic").attr("src", "./images/pornHubLogo.png");
            acceptableAnswers = "human intercourse, blow job, sex";
            break;

        default:
            alert("ERROR: unknown animal noise requested");
    }

    if (mySoundOn){
        $("#animalNameDisplay").html(animalName);
        soundToPlay.play();
    }

    var newLi = document.createElement("li");
    newLi.appendChild(document.createTextNode("Acceptable answers: " + acceptableAnswers));
    $("#messageList").append(newLi);
    $("#messageHistory").scrollTop( $("#messageHistory").prop("scrollHeight"));

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
    var remainingTime = 60*2500 - (Date.now() - drawStuffTimerStarted);
    var secs = Math.floor((remainingTime%60000)/1000);
    var mins = Math.floor(remainingTime/60000);
    if(remainingTime > 0){
        $("#drawStuffTimerOutput").html(mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(remainingTime%1000/100));

        if (mySoundOn){
            if (drawStuffHintFlags[0] === 0 && remainingTime < 105*1000){
                if(mySoundOn){
                    $("#provideHint")[0].play();
                }
                drawStuffHintFlags[0] = 1;
            }
            else if (remainingTime < 30*1000 && drawStuffHintFlags[1] === 0){
                if (mySoundOn){
                    $("#provideHint")[0].play();
                }
                drawStuffHintFlags[1] = 1;
            }
        }
    }
    else{
        $("#drawStuffTimerOutput").html('00:00.0');
        if (mySoundOn){
            $("#HornHonk")[0].play();
        }
        artistAllowedToDraw = false;
        clearInterval(drawStuffTimer);
    }
}
function drawStuffStartTimer(){
    drawStuffTimerStarted = Date.now();
    clearInterval(drawStuffTimer);
    drawStuffTimer = setInterval(updateDrawStuffTimer, 100);
    artistAllowedToDraw = true;
    drawStuffHintFlags = [0,0];
}
function drawOnCanvas(data){
    drawStuffctx.fillRect(data.x, data.y, 3, 3);
}
function drawStuffResetGame(){
    clearInterval(drawStuffTimer);
    $("#drawStuffTimerOutput").html('2:30.0');
    artistAllowedToDraw = false;
    drawStuffctx.clearRect(0, 0, 801, 381);
    drawStuffctx.beginPath();
    drawStuffctx.fillStyle = 'black';
    document.getElementById("drawStuffTitleArea").style.display = 'flex';
    document.getElementById("drawStuffPromptArea").style.display = 'none';
    document.getElementById("artistLabel").innerHTML = "Artist: ";
}
function drawStuffCorrectStop(timeElapsed){
    clearInterval(drawStuffTimer);
    artistAllowedToDraw = false;
    var remainingTime = 60*2500 - (timeElapsed);
    var secs = Math.floor((remainingTime%60000)/1000);
    var mins = Math.floor(remainingTime/60000);
    $("#drawStuffTimerOutput").html(mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(remainingTime%1000/100));
    if (mySoundOn){
        $("#Ding")[0].play();
    }
    
}
function drawStuffDisplayAnswer(prompt){
    drawStuffctx.clearRect(0, 355, 801, 50);
    drawStuffctx.font = "16px Arial";
    drawStuffctx.textAlign = "center";
    drawStuffctx.fillStyle = 'darkgreen';
    drawStuffctx.fillText(prompt, 400, 375);
}

// Quizball
function quizBallShowPrompt(promptString){
    $("#quizBallPrompt").html(promptString);
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

    $("#quizBallLeftPlayerScore").html('0');
    $("#quizBallRightPlayerScore").html('0');

}
function quizBallControlUpdate(newState){
    qbGameState = newState;
    qbTechnicianOutputs.gameState.html(newState);

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
            quizBallTechnicianControlsLock(false);
        }
    }
}
function outputKinematicsDataToTechnician(){
    qbTechnicianOutputs.updateAge.html(Date.now() - qbLastUpdate);
    qbTechnicianOutputs.ballSpeed.html(qbData.ballSpeed);
    qbTechnicianOutputs.ballPosX.html(qbData.ballPosX.toFixed(4));
    qbTechnicianOutputs.ballPosY.html(qbData.ballPosY.toFixed(4));
    qbTechnicianOutputs.ballVelX.html(qbData.ballVelX.toFixed(4));
    qbTechnicianOutputs.ballVelY.html(qbData.ballVelY.toFixed(4));
    qbTechnicianOutputs.leftPos.html(qbData.leftPos.toFixed(4));
    qbTechnicianOutputs.leftVel.html(qbData.leftVel.toFixed(4));
    qbTechnicianOutputs.rightPos.html(qbData.rightPos.toFixed(4));
    qbTechnicianOutputs.rightVel.html(qbData.rightVel.toFixed(4));
    qbTechnicianOutputs.frozenSide.html(qbData.frozenSide);
    qbTechnicianOutputs.arrowsReversed.html(arrowKeysReversed.toString());
}
function quizBallRegenerateGraphics(){
 
    qbCtx.clearRect(0, 0, quizBallCanvasWidth, quizBallCanvasHeight + 5);
    qbCtx.beginPath();
    
    qbCtx.fillStyle = (qbData.frozenSide ==='left')? 'blue' : 'red';
    qbCtx.fillRect(leftPaddleColumn, qbData.leftPos - paddleHeight/2, paddleWidth, paddleHeight);
    qbCtx.fillStyle = (qbData.frozenSide ==='right')? 'blue' : 'red';
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
    //ball reached the left side of the screen
    else if (qbData.ballVelX < 0 && qbData.ballPosX - qbBallRad <= leftPaddleColumn + paddleWidth){
        //within the 'bounce buffer zone'
        if((qbData.ballPosY - 1.2*qbBallRad) < (qbData.leftPos + paddleHeight/2) && (qbData.ballPosY + 1.2*qbBallRad) > (qbData.leftPos - paddleHeight/2)){
        qbData.ballVelX = -1 * qbData.ballVelX;
        qbData.ballPosX = 2 * (leftPaddleColumn + paddleWidth + qbBallRad) - qbData.ballPosX;
        }
        else{
        //client: everything stops moving, wait for 'game over' from server
        qbData.ballVelX = 0;
        qbData.ballVelY = 0;
        qbData.leftVel = 0;
        qbData.rightVel = 0;
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
        //client: everything stops moving, wait for 'game over' from server
        qbData.ballVelX = 0;
        qbData.ballVelY = 0;
        qbData.leftVel = 0;
        qbData.rightVel = 0;
        }
    }
    
    if (myID === "Technician"){
        outputKinematicsDataToTechnician();
    }
    quizBallRegenerateGraphics();
}
function quizBallKinematicsUpdate(data){
    
    clearInterval(qbInterpolationTimer);
    qbData = data;
    qbLastUpdate = Date.now();

    if (document.activeElement !== qbSpeedInputBox){
        qbSpeedInputBox.val(qbData.ballSpeed);
    } 
    if (myID === "Technician"){
        outputKinematicsDataToTechnician();
    }
    if (qbGameState === 'active'){
        qbInterpolationTimer = setInterval(quizBallInterpolateMotion,  qbInterpolationPeriod);
    }
    quizBallRegenerateGraphics();   
}
function quizBallTechnicianControlsLock(locked){
    //locks everything except the reset button
    for (i = 0; i < qbPaddleFreezeButtons.length; i ++){
        qbPaddleFreezeButtons[i].disabled = locked;
    }
    $("#quizBallStartButton").prop("disabled", locked);
    $("#qbMiddleButton").prop("disabled", locked);
    qbSpeedInputBox.prop("disabled", locked);

    for (i = 0; i < qbSpeedButtons.length; i++){
        qbSpeedButtons[i].disabled = locked;
    }

}
function quizBallGameOver(data){
    qbCtx.font = "30px Arial";
    qbCtx.textAlign = "center";
    qbCtx.fillStyle = 'white';
    qbCtx.fillText("Game Over", quizBallCanvasWidth/2, quizBallCanvasHeight/2);
    
    qbCtx.font = "20px Arial";
    qbCtx.fillStyle = 'white';
    if(data.winner === 'left'){   
        qbCtx.fillText("Winner: " + $("#qbLeftPlayerSelect option:selected").text(), quizBallCanvasWidth/2, quizBallCanvasHeight/2 + 30);
    }
    else{
        qbCtx.fillText("Winner: " + $("#qbRightPlayerSelect option:selected").text(), quizBallCanvasWidth/2, quizBallCanvasHeight/2 + 30);
    }
    $("#quizBallLeftPlayerScore").html(data.leftScore);
    $("#quizBallRightPlayerScore").html(data.rightScore);
    quizBallTechnicianControlsLock(true);
}

// Pitch the Product
function pitchVideoControlCommand(command){
    switch (command){
        case "play":
            $("#pitchVideo")[0].play();
            break;
        
        case "pause":
            $("#pitchVideo")[0].pause();
            break;

        case "reset":
            $("#pitchVideo")[0].load();
            break;

    }
    
}
function pitchUpdateCountdown(){
    var timeToShow = 10*60*1000 - (Date.now() - pitchCountdownStarted);
    if (timeToShow <= 0){
        clearInterval(pitchCountdownTimer);
        $("#pitchTimeRemaining").html('0:00.0');
        if (mySoundOn){
            $("#HornHonk")[0].play();
        }
        

    }
    else{
        var secs = Math.floor((timeToShow%60000)/1000);
        var mins = Math.floor(timeToShow/60000);
        $("#pitchTimeRemaining").html("Time Remaining: " + mins + ':' + (secs < 10? '0': '') + secs + '.' + Math.floor(timeToShow%1000/100));
    }
}
function pitchCountdownStart(){
    pitchCountdownStarted = Date.now();
    pitchCountdownTimer = setInterval(pitchUpdateCountdown, 100);
}
function pitchItemVisibilityChange(data){
    if (data.item === "YouTube"){
        $("#pitchTitleRight").css("visibility", (data.visible)? "visible" : "hidden");
        $("#YouTubeVisibilityChk").prop("checked", data.visible); 
    }
    else if (data.item === "Ranking"){
        $("#playerRankingColumn").css("display", (data.visible && myName !== "HOST_NAME")? "flex" : "none");
        $("#rankingVisibilityChk").prop("checked", data.visible); 
        for (i = 0; i < 4; i ++){
            pitchProductRankingSelects[i].style.display = (i < numPlayers && data.visible)? "inline-block" : "none";
            pitchProductRankingLabels[i].style.display = (i < numPlayers && data.visible)? "inline-block" : "none";
            pitchProductResultsRows[i].style.display = (i < numPlayers)? "table-row": "none";
        }
    }
}
function pitchShowScores(combinedData){ 
    $("#videoParentDiv").hide();
    $("#playerRankingColumn").hide();
    $("#pitchResultsDisplayArea").css("display", "flex");
    $("#pitchComputeScoresBtn").prop("disabled", true);

    for (i = 0; i < numPlayers; i ++){
        pitchProductResultsNames[i].innerHTML = combinedData[i][0];
        pitchProductResultsScores[i].innerHTML = combinedData[i][1];
    }
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
function musicVolumeAdjusted(val){
    for(i = 0; i < themeMusic.length; i ++){
        themeMusic[i].volume = val/200
    }
}
function soundVolumeAdjusted(val){
    for(i = 0; i < technicianSounds.length; i ++){
        technicianSounds[i].volume = val/200
    }
}


// Shenanigans
function shenanigansButtonClicked(buttonName){
    if (buttonName === "releaseDancingPenguin"){
        socket.emit("releaseDancingPenguinRequest");
    }
    else if (buttonName === "reverseArrowKeys"){
        socket.emit('reverseArrowKeyDirectionRequest', !arrowKeysReversed);
    }
}


// Pass the Conch
function conchDeployPromptClicked(){
    var topicData = {
        question: null,
        leftStance: null,
        rightStance: null
    }
    topicData.question = $("#conchTopics option:selected").text();
    switch($("#conchTopics option:selected").val()){
        case "narwhals":
            topicData.leftStance =  "Yes, they are 100% real";
            topicData.rightStance = "No, they are ficticious beasts";
            break;

        case "hellsKitchen":
            topicData.leftStance =  "Definitely me!";
            topicData.rightStance = "Probably me";
            break;

        case "geckoHawk":
            topicData.leftStance =  "Better to be gecko";
            topicData.rightStance = "Better to be hawk";
            break;
    
        case "wallaceburg":
            topicData.leftStance =  "It is a ficticious city which is part of an Ontario conspiracy";
            topicData.rightStance = "It is a real city";
            break;

        case "daytimeDrinking":
            topicData.leftStance =  "Fun";
            topicData.rightStance = "Not fun";
            break;

        case "grossWords":
            topicData.leftStance =  "Moist is grosser";
            topicData.rightStance = "Phlem is grosser";
            break;

        case "homeReno":
            topicData.leftStance =  "Me";
            topicData.rightStance = "Me FOR SURE";
        break;

        case "season":
            topicData.leftStance =  "Spring is better";
            topicData.rightStance = "Fall is better";
            break;

        case "torture":
            topicData.leftStance =  "Yes";
            topicData.rightStance = "No";
            break;

        case "coitus":
            topicData.leftStance =  "";
            topicData.rightStance = "";
            break;

        case "billNye":
            topicData.leftStance =  "Without a doubt";
            topicData.rightStance = "No, better shows exist";
            break;

        case "legalize":
            topicData.leftStance =  "No, it should remain illegal";
            topicData.rightStance = "Yes, we should legalize it";
            break;

        default:
            topicData.question = "ERROR: unrecognized val on conch select option (html line 135ish)"
            break;
    }
    socket.emit('conchPromptRequest', topicData);
}
function conchPlayerSelectionsChanged(side){
    var dataToSend = {
        'sideToChange': side,
        'leftPlayerName': $("#conchLeftPlayerSelect option:selected").text(),
        'leftSelectedIndex': $("#conchLeftPlayerSelect").prop("selectedIndex"),
        'rightPlayerName': $("#conchRightPlayerSelect option:selected").text(),
        'rightSelectedIndex': $("#conchRightPlayerSelect").prop("selectedIndex")}; 
    socket.emit('conchPlayerChangeRequest', dataToSend);
}
function conchConvoStartClicked(){
    if ($("#conchLeftPlayerSelect").prop('selectedIndex') === $("#conchRightPlayerSelect").prop('selectedIndex')){
        alert("You have a player debating against themself. Re-evaluate your life choices.");
        return;
    }
    else if ($("#conchLeftPlayerSelect option:selected").text() === "" || $("#conchRightPlayerSelect option:selected").text() === ""){
        alert("Atleast one of your player name selections is invalid. DISCO STAN!");
        return;
    }
    socket.emit('conchConvoStartRequest');
}
function conchConvoPauseClicked(){
    if(silenceTimerRunning){
        socket.emit('conchSilencePauseRequest');
    }
    socket.emit('conchConvoPauseRequest');
}
function conchSilenceKeyPress(){
 
    if(silenceTimerRunning){
        socket.emit('conchSilencePauseRequest');
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
function sendMessageClicked(event){
    //prevents the page from being reloaded
    event.preventDefault();
    socket.emit('messageRequest', {"sender": myName, "message": $("#chatTextBox").val()});
    $("#chatTextBox").val('');
}


// Definitely Not Pictionary
function drawStuffDeployPromptClicked(){
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
    socket.emit('drawStuffResetRequest');
}
function drawStuffCorrectGuessClicked(){
    socket.emit('drawStuffCorrectGuessRequest')
}
function drawStuffDisplayAnswerClicked(){
    socket.emit('drawStuffDisplayAnswerRequest');
}


// Quizball
function quizBallQuestionChanged(){
    if ($("#quizBallQuestionsList option:selected").val() !== ""){
        switch($("#quizBallQuestionsList option:selected").val()){
            case "babyNames":
                socket.emit('messageRequest', {"sender": "Quizball", "message": "Baby names list: ", "link": "https://www.babycenter.com/top-baby-names-1986.htm"});
                break;
            
            case "planets":
                socket.emit('messageRequest', {"sender": "Quizball", "message": "There are 4,154 exoplanets, all with stupid names:", "link": "https://exoplanets.nasa.gov/exoplanet-catalog/"});
                break;

            default:
                alert("ERROR: unreconized val on quizball selection option: " + $("#quizBallQuestionsList option:selected").val());
                break;
        }
    }
    socket.emit('quizBallPromptRequest', $("#quizBallQuestionsList option:selected").text());
}
function quizBallFreezeButtonClicked(paddleString){

    switch (paddleString){
        case 'leftFreeze':
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'paddleFreeze', 'side':'left'});
            break;
        case 'rightFreeze':
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'paddleFreeze', 'side': 'right'});
            break;

        case 'leftRelease':
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'paddleFreeze', 'side': (qbAutoFreezeOpponent)? 'right' : 'neither'});
            break;

        case 'rightRelease':
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'paddleFreeze', 'side':(qbAutoFreezeOpponent)? 'left' : 'neither'});
            break;
    }
}
function quizBallGameControlClicked(operation){
    if (operation === qbGameState){
        return;
    }

    if (operation === 'active'){
        if ($("#qbLeftPlayerSelect option:selected").text() === $("#qbRightPlayerSelect option:selected").text()){
            alert("Hey wise guy, you've got a player playing against themself. Fix that chumbo!");
            return;
        }
        else if ($("#qbLeftPlayerSelect option:selected").text() === "" || $("#qbRightPlayerSelect option:selected").text() === ""){
            alert("You haven't selected players for both sides yet ya specky git!");
            return;
        }
    }
    
    socket.emit('quizBallControlRequest', operation);
}
function quizBallAutoFreezeOpponentClicked(autoFreezeOpponent){
    qbAutoFreezeOpponent = autoFreezeOpponent;
}
function quizBallSpeedModified(speedChange){
    if (speedChange === 0 && event.keyCode === 13){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': parseInt(document.getElementById('quizBallSpeedInput').value)});    
    }
    else if (speedChange === 1){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': qbData.ballSpeed + 20});    
    }
    else if (speedChange === -1){
        socket.emit('quizBallKinematicsModifyRequest', {'object': 'ball', 'ballSpeed': qbData.ballSpeed - 20});
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
        if(quizBallPlayerSide === 'left' && qbData.frozenSide !== 'left'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'velocity': -1*maxPaddleSpeed});
        }
        else if (quizBallPlayerSide === 'right' && qbData.frozenSide !== 'right'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'velocity': -1*maxPaddleSpeed});
        }   
   }
   else if (event.keyCode === 40 && !downArrowPressed){
        downArrowPressed = true;
        if(quizBallPlayerSide === 'left' && qbData.frozenSide !== 'left'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'velocity': maxPaddleSpeed});
        }
        else if (quizBallPlayerSide === 'right'  && qbData.frozenSide !== 'right'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'velocity': maxPaddleSpeed});
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
        if(quizBallPlayerSide === 'left'&& qbData.frozenSide !== 'left'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'leftPaddle', 'velocity': 0});
        }
        else if (quizBallPlayerSide === 'right' && qbData.frozenSide !== 'right'){
            socket.emit('quizBallKinematicsModifyRequest', {'object': 'rightPaddle', 'velocity': 0});
        }
    }
}


// Pitch the Product
function pitchVisibilityChanged(itemToModify){
    if (itemToModify === "YouTube"){
        socket.emit('pitchItemVisibilityRequest', {'item': itemToModify, 'visible': $("#YouTubeVisibilityChk").prop("checked")});
    }
    else if (itemToModify === "Ranking"){
        socket.emit('pitchItemVisibilityRequest', {'item': itemToModify, 'visible': $("#rankingVisibilityChk").prop("checked")});
    }
}
function pitchStartCountdownClicked(){
    socket.emit('pitchCountdownStartRequest');
}
function pitchVideoControlClicked(command){
    socket.emit('pitchVideoControlRequest', command);
}
function pitchRankingsSubmitted(){
    var rankings = new Array(numPlayers);
    for (i = 0; i < numPlayers; i++){
        rankings[i] = pitchProductRankingSelects[i].options[pitchProductRankingSelects[i].selectedIndex].text;
    }
    var sortedRankings = rankings.slice().sort();
    for (i = 0; i < numPlayers; i ++){
        if(sortedRankings[i+1] === sortedRankings[i]){
            $("#rankingsErrorMessage").html("You cannot repeat player names. Please fix this.");
            return;
        }
    }
    $("#rankingsErrorMessage").html("Submission received, thank you.");
    $("#pitchSubmitRankingsBtn").prop("disabled", true);
    socket.emit('pitchPlayerRankingsSubmission', {'senderName': myName, 'senderID': myID, 'rankings': rankings});
}
function pitchCastBonusSubmitClicked(){
    if (myName === "HOST_NAME"){
        socket.emit('pitchCastMemberBonusSubmission', {'name': myName, 'recipient': $("#pitchHostBonus option:selected").text()}); 
        $("#pitchHostSubmitBtn").prop("disabled", true);
    }
    else if (myName === "TECHNICIAN_GEOFF"){
        socket.emit('pitchCastMemberBonusSubmission', {'name': myName, 'recipient': $("#pitchTechnicianBonus option:selected").text()}); 
        $("#pitchTechnicianSubmitBtn").prop("disabled", true);
    }   
}
function pitchScoreButtonClicked(btnClicked){
    socket.emit('pitchScoreActionRequest', btnClicked);
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
function playerImageChanged(data){
    socket.emit('playerImageChangeRequest', data);

    if (playerPicOptions[data.selectedIndex].updateName){
        var newNames = allPlayerNames;
        newNames[data.ID - 1] = playerPicOptions[data.selectedIndex].name
        socket.emit('nameChangeRequest', newNames);
    }
}
function testSocketsClicked(){
    for (i = 0; i < 4; i ++){
        technicianSocketStatusCells[i].innerHTML = (allPlayerNames[i] !== null)? "no response": " ";
    }
    document.getElementById("hostSocketStatusCell").innerHTML = "no response";
    socket.emit('technicianTestSocketsRequest');
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
            newScores[i] = parseInt(technicianScoreBoxes[i].value) + (scoreAwards[parseInt(recData.awardIndex)] * parseInt(recData.sign));
        }
        else{
            newScores[i] = parseInt(technicianScoreBoxes[i].value);
        }
    }
    socket.emit('scoreChangeRequest', newScores);
}
function startIntroMusicClicked(){
    socket.emit('introMusicRequest');
}
function showIntroScriptClicked(){
    socket.emit('introScriptRequest');
}


