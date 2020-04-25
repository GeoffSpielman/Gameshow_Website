var socket = io();


socket.on('playerListChanged', playerListChanged);
socket.on('newObserver', newObserver);


var playerName = null;
var playerID = null;
var numPlayers = 1;

var nametags;

function pageFinishedLoading(){
    nametags = [document.getElementById("player1Name"),
                document.getElementById("player2Name"),
                document.getElementById("player3Name"), 
                document.getElementById("player4Name")];
}


function clickedJoinGame(){
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


function playerListChanged(data){
    var recData = JSON.parse(data);
    numPlayers = recData.numPlayers;
    //iterate over ALL name tags (even if null), determine your id number
    for (i = 0; i < 4; i ++){
        nametags[i].innerHTML = recData.names[i];
        if (recData.names[i] == playerName)
        {
            playerID = i + 1;
        }
    }
    updatePlayerVisibility(recData.names);
}

function newObserver(data){
    var recData = JSON.parse(data);

    //if the user was expecting to play and wasn't added to the list, alert them
    if  (playerName != "AUDIENCE_MEMBER" && recData.names.indexOf(playerName) == -1){
        alert("Unfortunately the game is full. You are now watching as an audience member")
        playerName = "AUDIENCE_MEMBER";
    }

    playerListChanged(data);
}

function userAuthentication(role){
    // alert("tried to login as " + role);
    document.getElementById("authFailedPic").style.display = "block";
    document.getElementById("garrettButton").disabled = true;
    document.getElementById("garrettButton").style.background = "LightGrey";
    document.getElementById("geoffButton").disabled = true;
    document.getElementById("geoffButton").style.background = "LightGrey";
    

}

function audienceMemberClicked(){
    playerName = "AUDIENCE_MEMBER";
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "flex";
    socket.emit('audienceRequest')
}


function playerLeftGame(){
    //It only matters if a player leaves the game
    if (playerName != "AUDIENCE_MEMBER"){
        playerInfo = JSON.stringify({"name":playerName, "number": playerID});
        socket.emit("leaveGame", playerInfo)
    }   
}
