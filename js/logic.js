var Game = {};

/* CONSTANTS */

Game.MIN_PLAYERS = 2;
Game.MAX_PLAYERS = 4;
Game.STARTING_DOLLARS = 1500;
Game.STARTING_FREE_PARKING_DOLLARS = 500;
Game.BOARD_SIZE = 800;
Game.BOARD_MARGIN = 10;
Game.TOKEN_SIZE = 16;
Game.TOKEN_COLORS = ['red', 'blue', 'green', 'black'];

Game.MISS_TURN_IN_JAIL = false;
Game.LAND_ON_GO_DOUBLES = true;
Game.TOTAL_HOUSES = 32;
Game.TOTAL_HOTELS = 12;

/* PROPERTIES */

Game.players = [];
Game.playerCountHuman = 0;
Game.playerCountAI = 0;
Game.freeParkingDollars = 0;
Game.boardData = [];
Game.spaces = [];
Game.state = 'game-setup';


Game.chanceData = [];
Game.chanceCards = [];
Game.communityData = [];
Game.communityCards = [];
Game.usedChanceCards = [];
Game.usedCommunityCards = [];
Game.usingCard = false;


Game.buyingHouses = false;
Game.sellingHouses = false;
Game.soldHouses = 0;
Game.soldHotels = 0;

Game.mortgaging = false;
Game.unmortgaging = false;





Game.init = function() {


  Game.loadData(function(){

    Game.cacheDom();

    UI.drawBoard();

    Game.getPlayerCount();
    Game.createPlayers();

    Game.setupGameSession();
    UI.presentPlayerInfo();
    UI.presentPropertyInfo();

    Game.bindEventListeners();

    Debug.setupMidgame();
    Game.setState("game-begin");


  });


}

Game.cacheDom = function() {

  Game.dom = {};
  Game.dom.dice = document.getElementById("dice");
  Game.dom.die1 = document.getElementById("die-1");
  Game.dom.die2 = document.getElementById("die-2");

  Game.dom.playerInfo = document.getElementById("player-info");
  Game.dom.propertyInfo = document.getElementById("property-info");

  Game.dom.board = document.getElementById("board");

  Game.dom.actions = {};
  Game.dom.actions.jailPay = document.getElementById("btn-jail-pay");
  Game.dom.actions.jailCard = document.getElementById("btn-jail-card");
  Game.dom.actions.buyHouses = document.getElementById("btn-houses");
  Game.dom.actions.sellHouses = document.getElementById("btn-houses-sell");
  Game.dom.actions.mortgage = document.getElementById("btn-mortgage");
  Game.dom.actions.unmortgage = document.getElementById("btn-unmortgage");


}


Game.bindEventListeners = function() {


  /* Roll Dice */
  Game.dom.dice.onclick = function() {

    var activePlayer = Player.getActive();

    switch(Game.state){

      case "game-setup":
        break;

      case "game-begin":
        break;

      case "turn-begin":

        if(activePlayer.inJail && activePlayer.rollsInJail >= 3){
          activePlayer.leaveJail();
        }

        if(!activePlayer.inJail){
          Game.rollDice(function(roll){
            activePlayer.lastRoll = roll;

            Game.movePlayerBy(activePlayer, roll.total);

            if(roll.doubles){
              activePlayer.doublesInARow++;

              if(activePlayer.doublesInARow >= 3){
                activePlayer.doublesInARow = 0;
                alert("{0} rolled doubles 3 times in a row. GO TO JAIL!".format([activePlayer.name]));
                activePlayer.goToJail();
              } else {
                Game.setState('turn-begin');
              }

            } else {
              activePlayer.doublesInARow = 0;
              Game.setState('turn-middle');
            }

          });
        } else {

          Game.rollDice(function(roll){

            if(roll.doubles){
              activePlayer.leaveJail();
              Game.movePlayerBy(activePlayer, roll.total);
            } else {
              activePlayer.rollsInJail++;
              Game.nextPlayer();
            }


          });

        }


        break;

      case "turn-middle":
        break;

      case "turn-complete":
        break;

    }

  }

  Game.dom.actions.jailPay.onclick = function() {

    var activePlayer = Player.getActive();

    if(!activePlayer.inJail) {
      alert("Can only be used when you are in jail.");
      return false;
    }

    activePlayer.spend(50);
    Game.freeParkingDollars += 50;
    activePlayer.leaveJail();
    alert("You are free!");


  }

  Game.dom.actions.jailCard.onclick = function() {

    var activePlayer = Player.getActive();

    if(!activePlayer.inJail) {
      alert("Can only be used when you are in jail.");
      return false;
    }

    if(activePlayer.hasInventoryItem('jail-card')){

      activePlayer.useInventoryItem('jail-card');
      activePlayer.leaveJail();
      alert("You are free!");

    }


    return false;

  }


  Game.dom.actions.buyHouses.onclick = function() {

    if(!Game.buyingHouses){

      Game.buyingHouses = true;
      Game.dom.actions.buyHouses.value = "Finish Buying";
      alert("Choose a property!");

    } else {

      Game.buyingHouses = false;
      Game.dom.actions.buyHouses.value = "Buy Houses";

    }

  }

  Game.dom.actions.mortgage.onclick = function() {

    if(!Game.mortgaging){

      Game.mortgaging = true;
      Game.dom.actions.mortgage.value = "Finish Mortgaging";
      alert("Choose a property!");

    } else {

      Game.mortgaging = false;
      Game.dom.actions.mortgage.value = "Mortgage";

    }

  }

  Game.dom.actions.unmortgage.onclick = function() {

    if(!Game.unmortgaging){

      Game.unmortgaging = true;
      Game.dom.actions.unmortgage.value = "Finish Unmortgaging";
      alert("Choose a property!");

    } else {

      Game.unmortgaging = false;
      Game.dom.actions.unmortgage.value = "Unmortgage";

    }

  }



  var spaces = document.getElementsByClassName("space");
  for(var i=0; i<spaces.length; i++){
      var space = spaces[i];
      space.addEventListener('click', function(event){
          Game.spaceClicked(event);
      }, false);
  }


}


Game.spaceClicked = function(event) {

  var spaceElement = event.target;
  var space = Game.spaces[parseInt(spaceElement.id.replace("space-", ""))];
  var activePlayer = Player.getActive();

  if(Game.buyingHouses){

    if(space.canBuyHouse(activePlayer)){

      var housePrice = space.house;
      space.addHouse();
      activePlayer.spend(housePrice);
      alert("{0} buys house for ${1}".format([activePlayer.name, housePrice]));

    }

  } else if(Game.mortgaging) {

    if(space.canMortage(activePlayer)){

      var mortgageValue = space.cost / 2;

      space.mortgage();
      activePlayer.earn(mortgageValue);
      alert("{0} mortgages {1} for ${2}".format([activePlayer.name, space.name, mortgageValue]));

    }


  } else if(Game.unmortgaging) {

    console.log("unmort");

    if(space.canUnmortage(activePlayer)){

      var unmortgageValue = Math.ceil((space.cost / 2) * 1.1);

      space.unmortgage();
      activePlayer.spend(unmortgageValue);
      alert("{0} unmortgages {1} for ${2}".format([activePlayer.name, space.name, unmortgageValue]));

    }

  }



}


Game.setState = function(state){

  UI.presentPlayerInfo();

  Game.state = state;

  switch(state){

    case "game-setup":
      break;

    case "game-begin":
      return Game.setState('turn-begin');
      break;

    case "turn-begin":
      break;

    case "turn-middle":
      Game.setState('turn-complete');
      break;

    case "turn-complete":
      Game.nextPlayer();
      break;

  }




}

Game.getPlayerCount = function(prepend) {

  if(Debug.active){
    Game.playerCountHuman = 2;
    Game.playerCountAI = 0;
    return true;
  }

  if(typeof prepend == 'string'){
    alert(prepend);
  }

  var humans = parseInt(prompt("How many human players?")) || 0;

  if(humans < 1){

    return Game.getPlayerCount("Minimum human players is 1");
  }

  var computers = parseInt(prompt("How many computer players?")) || 0;

  var total_players = computers + humans;

  if(total_players < Game.MIN_PLAYERS){

    return Game.getPlayerCount("More than "+ Game.MIN_PLAYERS + " is required!");

  } else if(total_players > Game.MAX_PLAYERS){

    return Game.getPlayerCount("Less than "+ Game.MIN_PLAYERS + " is required!");

  }


  Game.playerCountHuman = humans;
  Game.playerCountAI = computers;

  return true;

}

Game.createPlayers = function() {

  var names = ['Tyler', 'Bob'];

  for(var i=0;i<Game.playerCountHuman;i++){
    var name = names[i];
    var element = document.createElement('div');
    element.className = "player";
    element.id = "player-" + i;
    element.style.background = Game.TOKEN_COLORS[i];
    element.setAttribute('title', name);

    Game.dom.board.appendChild(element);

    var player = new Player(i, name, true, Game.STARTING_DOLLARS, Game.TOKEN_COLORS[i], element);
    Game.players.push(player);

    player.presentPosition();

  }

}

Game.setupGameSession = function() {

  Game.freeParkingDollars = Game.STARTING_FREE_PARKING_DOLLARS;
  Game.determineFirstPlayer(Game.players);

  Game.setupChance();
  Game.setupCommunity();

}


Game.setupChance = function() {

    for(i=0; i<Game.chanceData.length; i++){
        var c = Game.chanceData[i];
        var chanceCard = new Card(c.description, c.type, c.amount, 'chance');
        Game.chanceCards.push(chanceCard);
    }

    Game.chanceCards = Utils.shuffleArray(Game.chanceCards);

}

Game.setupCommunity = function() {

    for(i=0; i<Game.communityData.length; i++){
        var c = Game.communityData[i];
        var communityCard = new Card(c.description, c.type, c.amount, 'community');
        Game.communityCards.push(communityCard);
    }

    Game.communityCards = Utils.shuffleArray(Game.communityCards);

}


Game.loadData = function(callback) {

  Utils.loadJson('js/board.json', function(boardData){

    Game.boardData = boardData;

    Utils.loadJson('js/chance.json', function(chanceData){

      Game.chanceData = chanceData;

      Utils.loadJson('js/community.json', function(communityData){

        Game.communityData = communityData;

        callback();

      });

    });

  });


}


Game.determineFirstPlayer = function(players) {
  Game.players[0].active = true;

  alert("The starting player will be " + Game.players[0].name + "!");

}

Game.rollDice = function(callback) {

  var forceDoubles = document.getElementById("force-doubles");

  if(forceDoubles.checked){
    var value1 = 6;
    UI.presentDie(1, value1);

    var value2 = 6;
    UI.presentDie(2, value2);

    callback({'total': value1 + value2, 'value1': value1, 'value2': value2, 'doubles': true });

    return;
  }

  var totalSpins = 10;
  var currentSpin = 0;

  var spinInterval = window.setInterval(function(){
    currentSpin++;

    var value1 = Utils.randomInt(1, 6);
    UI.presentDie(1, value1);

    var value2 = Utils.randomInt(1, 6);
    UI.presentDie(2, value2);

    if(currentSpin >= totalSpins){
      clearInterval(spinInterval);

      var total = value1 + value2;

      var doubles = (value1 == value2) ? true : false;

      callback({'total': total, 'value1': value1, 'value2': value2, 'doubles': doubles });

    }


  }, 100);


}

Game.movePlayerBy = function(player, amount) {

  player.position += amount;
  if(player.position >= 40){
    player.position -= 40;
    player.earn(200);
  }

  player.presentPosition();

  var space = Game.spaces[player.position];
  space.landedOn(player);


}


Game.nextPlayer = function() {

  var i = Player.getActiveNumber() + 1;
  if(i >= Game.players.length){
    i = 0;
  }

  Player.getActive().active = false;
  Game.players[i].active = true;
  Game.setState('turn-begin');

}


window.onload = function() {

    Game.init();

}
