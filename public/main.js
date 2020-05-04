var socket = io();
socket.on('playerListChanged', playerListChanged);
socket.on('newObserver', newObserver);
socket.on('newCastMember', newCastMember);
socket.on('messageDelivery', messageDelivery);
socket.on('gameDataDelivery', gameDataDelivery);
socket.on('playerScoresChanged', playerScoresChanged);
socket.on('consoleDelivery', consoleDelivery);
socket.on('gameStarting', gameStarting);
socket.on('gameEnded', gameEnded);


//game variables
var playerName = null;
var playerID = null;
var numPlayers = 1;


//useful lists of HTML elements
var nametags;
var scoreBoxes;
var chatDisplayRegion;
var technicianNameBoxes;
var technicianScoreBoxes;
var technicianSocketCells;
var technicianIPcells;
var consoleDisplayRegion;
var gameSelectionList;



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

    consoleDisplayRegion = document.getElementById("consoleArea");

    gameSelectionList =  document.getElementById('gameList');

    for (i = 0; i < 4; i++){
        technicianNameBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){modifyNamesClicked()}
        });
        technicianScoreBoxes[i].addEventListener("keyup", function(e){
            if (e.keyCode === 13){modifyScoresClicked()}
        });

    }


    //don't let the user go anywhere until everything above is done
    document.getElementById("joinButton").disabled = false;
    document.getElementById("observerButton").disabled = false;
    document.getElementById("garrettButton").disabled = false;
    document.getElementById("geoffButton").disabled = false;

}

function clickedJoinGame(event){
    event.preventDefault();

    playerName = document.playerNameForm.playerNameInput.value;
    socket.emit('playerRequest', playerName)
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
}



function updatePlayerVisibility(names){

    //player 1 and 3 present (left side only)
    if (names[0] != null && names[2] != null){
        document.getElementById("player1div").style.display = "flex";
        document.getElementById("player1div").style.height = "50%";
        document.getElementById("player3div").style.display = "flex";
        document.getElementById("player3div").style.height = "50%";
    }
    //only player 1 present (left side only)
    else if(names[0] != null){
        document.getElementById("player3div").style.display = "none";
        document.getElementById("player1div").style.display = "flex";
        document.getElementById("player1div").style.height = "100%";
        
    }
    //only player 3 present (left side only)
    else if(names[2] != null){
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
    if (names[1] != null && names[3] != null){
        document.getElementById("player2div").style.display = "flex";
        document.getElementById("player2div").style.height = "50%";
        document.getElementById("player4div").style.display = "flex";
        document.getElementById("player4div").style.height = "50%";
    }
    //only player 2 present (right side only)
    else if(names[1] != null){
        document.getElementById("player4div").style.display = "none";
        document.getElementById("player2div").style.display = "flex";
        document.getElementById("player2div").style.height = "100%";
        
    }
    //only player 4 present (right side only)
    else if(names[3] != null){
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
    for (i = 0; i < 4; i ++){
        technicianNameBoxes[i].value = recData.names[i];
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
    //iterate over ALL name tags (even if null), determine your id number
    for (i = 0; i < 4; i ++){
        nametags[i].innerHTML = recData.names[i];
        if (recData.names[i] === playerName)
        {
            playerID = i + 1;
        }
        scoreBoxes[i].innerHTML = recData.scores[i];
    }
    updatePlayerVisibility(recData.names);
}

function playerScoresChanged(newScores){
    for (i = 0; i < 4; i ++){
        scoreBoxes[i].innerHTML = newScores[i];
    }
}

function newObserver(data){
    var recData = JSON.parse(data);

    //if the user was expecting to play and wasn't added to the list, alert them
    if  (playerName != 'AUDIENCE_MEMBER' && recData.names.indexOf(playerName) == -1){
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
    newLi.appendChild(document.createTextNode(senderName + ': ' + recData.message));
    document.getElementById('messageList').appendChild(newLi);
    chatDisplayRegion.scrollTop = chatDisplayRegion.scrollHeight;
}

function gameDataDelivery(data){
    updateGameDataTable(JSON.parse(data));
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

function consoleDelivery(message){
    var newMsg = document.createElement("li");
    newMsg.appendChild(document.createTextNode(message));
    document.getElementById('consoleOutput').appendChild(newMsg);
    consoleDisplayRegion.scrollTop = consoleDisplayRegion.scrollHeight;
}

function gameStarting(gameName){
    gameVue.startGame(gameName);
}
function gameEnded(){
    gameVue.endGame();
}





function audienceMemberClicked(){
    playerName = "AUDIENCE_MEMBER";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    socket.emit('audienceRequest')
}

function startGameClicked(){
    if(gameSelectionList.selectedIndex === -1){
        alert("hey hot shot, why don't you select a game first?")
    }
    else{
        socket.emit('gameStartRequest', gameSelectionList.options[gameSelectionList.selectedIndex].text)
    }
    document.getElementById('gameList').selectedIndex = -1;
}

function endGameClicked(){
    socket.emit('gameEndRequest');
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

function requestDataClicked(){
    socket.emit('gameDataRequest')
}

function modifyNamesClicked(){
    var newNames = [null, null, null, null];
    for (i = 0; i < 4; i ++){
        if (technicianNameBoxes[i].value == ''){
            newNames[i] = null;
        }
        else{
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


function playerLeftGame(){
    playerInfo = JSON.stringify({"name":playerName, "number": playerID});
    socket.emit("leaveGame", playerInfo)
}

var gameVue = new Vue({
	//which part of the HTML should be 'under control' of the Vue instance
	el: '#gameScreen',
    data: {
  	    passTheConchDisplay: 'none',
    },

    methods: {
  	    startGame: function(gameName){
            this.passTheConchDisplay = (gameName === 'Pass the Conch') ? 'flex' : 'none';
        },

        endGame: function(){
            this.passTheConchDisplay = 'none';
        },

        conchDeployPrompt: function(prompt){
            var promptList = document.getElementById("conchTopics");
            if (promptList.selectedIndex === -1){
                alert("hey dr. smooth, you wanna select a prompt first?")
            }
            else{
                alert("prompt selected: " + promptList.options[promptList.selectedIndex].text);
                promptList.selectedIndex = -1;
            }
            
            
        }


    }
});
