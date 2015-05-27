
/* MODELS */

/* Player */

Player = function(id, name, human, dollars, color, element){

  this.id = id;
  this.name = name;
  this.human = human;
  this.dollars = dollars;
  this.active = false;
  this.inJail = false;
  this.lastRoll = null;
  this.doublesInARow = 0;
  this.position = 0;
  this.color = color;
  this.element = element;
  this.ownedProperties = [];
  this.rollsInJail = 0;
  this.inventory = [];


}

Player.get = function(i) {
  return Game.players[i];
}


Player.getActive = function() {

  for(var i=0;i<Game.players.length;i++){
    var player = Game.players[i];
    if(player.active){
      return player;
    }
  }

  return Game.players[0];

}


Player.getActiveNumber = function() {

  for(var i=0;i<Game.players.length;i++){
    var player = Game.players[i];
    if(player.active){
      return i;
    }
  }

  return 0;

}

Player.prototype.presentPosition = function() {

  var space = Game.spaces[this.position];

  var newTokenPosition = space.getTokenPosition();

  this.element.style.left = (newTokenPosition.left - Game.BOARD_MARGIN) + (Game.BOARD_SIZE / 11 / 2) - ( Game.TOKEN_SIZE / 2 )  + 'px';
  this.element.style.top = (newTokenPosition.top - Game.BOARD_MARGIN)  + (Game.BOARD_SIZE / 11 / 2) - ( Game.TOKEN_SIZE / 2 ) + 'px';


}

Player.prototype.spend = function(amount) {

  this.dollars -= amount;

  UI.presentPlayerInfo();

}

Player.prototype.earn = function(amount) {

  this.dollars += amount;

  UI.presentPlayerInfo();

}

Player.prototype.ownsProperty = function(space) {

  for(var i=0; i<this.ownedProperties.length; i++){
    var s = this.ownedProperties[i];
    if(space.id == s.id){
      return true;
    }
  }

  return false;

}


Player.prototype.hasFullPropertySet = function(space) {

  if(typeof space == 'undefined'){
    console.log("Programming Error: forgot to pass in space");
    return false;
  }

  var group = space.group;

  if(!group.length){
    return false;
  }

  var set = group[0];
  var num = group[1];
  var total = group[2];

  var count = 0;

  for(var i=0; i<this.ownedProperties.length; i++){
    var s = this.ownedProperties[i];
    if(s.group && s.group[0] == set){
      count++;
    }
  }

  if(count == total){
    return true;
  }

  return false;


}

Player.prototype.numberOfOwnedRailroads = function(){

  var count = 0;
  for(var i=0; i<this.ownedProperties.length; i++){
    var s = this.ownedProperties[i];
    if(s.type == 'railroad'){
      count++;
    }
  }

  return count;

}

Player.prototype.numberOfOwnedUtilities = function() {

  var count = 0;
  for(var i=0; i<this.ownedProperties.length; i++){
    var s = this.ownedProperties[i];
    if(s.type == 'utility'){
      count++;
    }
  }

  return count;
}


Player.prototype.goToJail = function() {

  this.inJail = true;
  this.position = 10;
  this.presentPosition();

  Game.nextPlayer();

}

Player.prototype.leaveJail = function() {

  this.inJail = false;
  this.rollsInJail = 0;

  if(Game.MISS_TURN_IN_JAIL){
    Game.nextPlayer();
  }

}

Player.prototype.drawCard = function(type) {

  if(type == 'chance'){

    if(Game.chanceCards.length < 1){
      Game.chanceCards = Game.usedChanceCards;
      Game.usedChanceCards = [];
      Game.chanceCards = Utils.shuffleArray(Game.chanceCards);
    }

    var card = Game.chanceCards.shift();
    Game.usedChanceCards.push(card);

    alert("Chance Card: {0}".format([card.description]));
    card.applyAction();

  } else if(type == 'community'){

    if(Game.communityCards.length < 1){
      Game.communityCards = Game.usedCommunityCards;
      Game.usedCommunityCards = [];
      Game.communityCards = Utils.shuffleArray(Game.communityCards);
    }

    var card = Game.communityCards.shift();
    Game.usedCommunityCards.push(card);

    alert("Community Card: {0}".format([card.description]));
    card.applyAction();

  }

}


Player.prototype.hasInventoryItem = function(type) {

  for(var i=0; i<this.inventory.length; i++){
    var card = this.inventory[i];
    if(card.type == type){
      return true;
    }
  }

  return false;

}

Player.prototype.useInventoryItem = function(type) {

  if(!this.hasInventoryItem(type)){
        console.log("Can't use an item you don't have");
        return false;
    }

    for(var i = this.inventory.length - 1; i>=0; i--){
        if(this.inventory[i].type == type) {
            var card = this.inventory[i];
            this.inventory.splice(i, 1);

            if(card.kind == 'chance'){
                Game.usedChanceCards.push(card);
            } else {
                Game.usedCommunityCards.push(card);
            }
        }
    }

}


/* Space */

Space = function(id, name, type, cost, color, position, placement, rent, group, house){


  this.id = id;
  this.name = name;
  this.type = type;
  this.cost = cost || 0;
  this.color = color || "#ffffff";
  this.position = position;
  this.placement = placement;
  this.mortgaged = false;
  this.rent = rent || 0;
  this.group = group || [];
  this.house = house || 0;
  this.houseCount = 0;


}

Space.prototype.getTokenPosition = function() {
    var spaceElement = document.getElementById("space-" + this.id);

    var top = spaceElement.documentOffsetTop;
    var left = spaceElement.documentOffsetLeft;

    return { 'top': top, 'left': left };
}


Space.prototype.landedOn = function(player) {

  switch(this.type){

    case "property":
    case "railroad":
    case "utility":

      if(this.owned && !this.mortgaged) {
        var ownedByPlayer = Game.players[this.ownedBy];

        if(ownedByPlayer.id != Player.getActiveNumber()){
          var dollars = this.getRentPrice();

          alert("{0} pays {1} ${2} in rent.".format([player.name, ownedByPlayer.name, dollars]));


          player.spend(dollars);
          ownedByPlayer.earn(dollars);
        }

      } else {

        var buy = confirm("Would you like to buy {0} for ${1}?".format([this.name, this.cost]));

        if(buy){

          this.buyProperty(player);
        }

      }

      break;
    case "tax":
      player.spend(this.cost);
      Game.freeParkingDollars += this.cost;
      break;
    case "jail":
      break;
    case "go":
      if(Game.LAND_ON_GO_DOUBLES && !Game.usingCard){
        player.earn(200);
      }
    break;
    case "free-parking":
      player.earn(Game.freeParkingDollars);
      Game.freeParkingDollars = 0;
      break;
    case "chance":
      player.drawCard('chance');
      break;
    case "community-chest":
      player.drawCard('chance');
      break;
    case "go-to-jail":
      player.goToJail();
      break;



  }

}


Space.prototype.buyProperty = function(player) {
  player.spend(this.cost);
  player.ownedProperties.push(this);
  this.owned = true;
  this.ownedBy = player.id;
  UI.presentPropertyInfo();
}

Space.prototype.getRentPrice = function() {

  if(!this.owned){
    return 0;
  }

  if(this.mortgaged){
    return 0;
  }


  var ownedByPlayer = Game.players[this.ownedBy];

  switch(this.type){

    case "property":

      if(this.houseCount > 0){
        return this.rent[this.houseCount];
      }

      if(ownedByPlayer.hasFullPropertySet(this)){
        return this.rent[0] * 2;
      }

      return this.rent[0];
      break;
    case "railroad":

      switch(ownedByPlayer.numberOfOwnedRailroads()){
        case 0:
          return 0;
          break;
        case 1:
          return 25;
          break;
        case 2:
          return 50;
          break;
        case 3:
          return 100;
          break;
        case 4:
          return 200;
          break;
      }

      break;
    case "utility":

    switch(ownedByPlayer.numberOfOwnedUtilities()){
      case 0:
        return 0;
        break;
      case 1:
        return 4 * Player.getActive().lastRoll.total;
        break;
      case 2:
        return 10 * Player.getActive().lastRoll.total;
        break;
      }

    break

  }

}

Space.prototype.otherPropertiesInSet = function() {

  if(typeof this.group === 'undefined'){
    return [];
  }

  var group = this.group;
  var set = group[0];
  var num = group[1];
  var total = group[2];

  var spaces = [];
  for(var i=0; i<Game.spaces.length; i++){

    var s = Game.spaces[i];
    if(s.group && s.group[0] == set){
      spaces.push(s);
    }

  }

  return spaces;

}


Space.prototype.canMortage = function(player) {

  if(this.type != 'property' && this.type != 'utility' && this.type != 'railroad' ){
    alert("Can only mortgage properties/utilities/railroads.");
    return false;
  }

  if(!player.ownsProperty(this)){
    alert("{0} does not own this property.".format([player.name]));
    return false;
  }

  if(this.mortgaged){
    alert("Already mortgaged");
    return false;
  }


  return true;

}


Space.prototype.canUnmortage = function(player) {


  if(!player.ownsProperty(this)){
    alert("{0} does not own this property.".format([player.name]));
    return false;
  }

  if(!this.mortgaged){
    alert("Property not mortgaged.");
    return false;
  }

  return true;

}


Space.prototype.mortgage = function() {

  this.mortgaged = true;

  UI.presentPropertyInfo();

}

Space.prototype.unmortgage = function() {

  this.mortgaged = false;

  UI.presentPropertyInfo();

}



Space.prototype.canBuyHouse = function(player) {

  if(!player.ownsProperty(this)){
    alert("{0} does not own this property.".format([player.name]));
    return false;
  }


  if(this.type != 'property'){
    alert("Can only buy houses on properties.");
    return false;
  }

  if(!player.hasFullPropertySet(this)){
    alert("You must own a full property set.");
    return false;
  }

  if(this.houseCount >= 5){
    alert("This space already has the maximum number of houses.");
    return false;
  }


  var otherPropertiesInSet = this.otherPropertiesInSet();
  for(var i=0; i<otherPropertiesInSet.length; i++) {

    var otherSpace = otherPropertiesInSet[i];
    if(otherSpace.houseCount < this.houseCount){
      alert("Houses must be built evenly.");
      return false;
    }

  }


  return true;

}

Space.prototype.addHouse = function() {

  this.houseCount++;
  UI.presentPropertyInfo();

}


Card = function(description, type, amount, kind) {

    this.description = description;
    this.type = type;
    this.amount = amount;
    this.kind = kind;

}


Card.prototype.applyAction = function() {

  var activePlayer = Player.getActive();

  switch(this.type){
      case "advance":
          Game.usingCard = true;
          if(this.amount == 'utility'){
              if(activePlayer.position >= 12 && activePlayer.position < 28){
                  var targetPosition = 28;
              } else {
                  var targetPosition = 12;
              }

          } else if (this.amount == 'railroad'){

              if(activePlayer.position >= 5 && activePlayer.position < 15){
                  var targetPosition = 15;
              } else if(activePlayer.position >= 15 && activePlayer.position < 25){
                  var targetPosition = 25;
              } else if (activePlayer.position >= 25 && activePlayer.position < 35){
                  var targetPosition = 35;
              } else {
                  var targetPosition = 5;
              }
          } else {
              //Game.usingCard = false;
              var targetPosition = this.amount;
          }

          var currentPosition = activePlayer.position;
          if(targetPosition < currentPosition){
              targetPosition += 40;
          }
          var moveBy = targetPosition - currentPosition;

          Game.movePlayerBy(activePlayer, moveBy);

          Game.usingCard = false;

          break;
      case "jail":
          activePlayer.goToJail();
          break;
      case "jail-card":
          activePlayer.inventory.push(this);
          Game.usedChanceCards.pop();
          break;
      case "back":
          Game.movePlayerBy(activePlayer, -this.amount);
          break;
      case "repairs":
          alert("No houses to repair!")
          // var houseAmount = this.amount[0];
          // var hotelAmount = this.amount[1];
          //
          // var totalDollars = 0;
          // for(i=0; i<activePlayer.ownedProperties.length; i++){
          //     var property = activePlayer.ownedProperties[i];
          //     if(property.houses == 5){
          //         totalDollars += hotelAmount;
          //     } else if(property.houses > 0){
          //         totalDollars += hotelAmount * property.houses;
          //     }
          // }
          //
          // activePlayer.spend(totalDollars);

          break;
      case "spend":
          activePlayer.spend(this.amount);
          break;
      case "spend-each-player":
          for(i=0; i<Game.players.length; i++){
              Game.players[i].earn(this.amount);
              activePlayer.spend(this.amount);
          }
          break;
      case "earn-each-player":
          for(i=0; i<Game.players.length; i++){
              Game.players[i].spend(this.amount);
              activePlayer.earn(this.amount);
          }
          break;
      case "earn":
          activePlayer.earn(this.amount);
          break;
    }

}
