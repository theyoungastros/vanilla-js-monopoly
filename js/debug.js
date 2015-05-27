/* Debug */
var Debug = {}
Debug.active = true;
Debug.autoSetPlayers = true;
Debug.manualRoll = false;
Debug.skipDetermineFirstPlayer = true;
Debug.automaticallySetupMidgame = true;

Debug.setupMidgame = function(){

    if(!Debug.active){
      return;
    }

    if(!Debug.automaticallySetupMidgame){
      return;
    }

    // Player 0
    var p = Game.players[0];
    p.position = 12;
    p.presentPosition();

    Game.spaces[1].buyProperty(p);
    Game.spaces[3].buyProperty(p);
    Game.spaces[21].buyProperty(p);
    Game.spaces[25].buyProperty(p);
    Game.spaces[35].buyProperty(p);

    Game.spaces[1].addHouse();
    Game.spaces[3].addHouse();
    Game.spaces[1].addHouse();
    Game.spaces[3].addHouse();
    p.spend(200);

    p.inventory.push(new Card('get out of jail yo', 'jail-card', 0, 'chance'));

    // Player 1
    var p = Game.players[1];
    p.position = 22;
    p.presentPosition();


    Game.spaces[6].buyProperty(p);
    Game.spaces[8].buyProperty(p);
    Game.spaces[9].buyProperty(p);
    Game.spaces[5].buyProperty(p);
    Game.spaces[15].buyProperty(p);



}
