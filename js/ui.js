/* UI */


var UI = {};

UI.presentDie = function(number, value) {

  var valueStrings = ['one', 'two', 'three', 'four', 'five', 'six'];

  if(number === 1){
    var die = Game.dom.die1;
  } else {
    var die = Game.dom.die2;
  }

  die.className = "die " + valueStrings[value - 1];

}

UI.presentPlayerInfo = function() {

  var html = '<table>';

  for(var i=0; i<Game.players.length; i++){

    var player = Game.players[i];
    var rowClass = player.active ? 'active' : '';

    html += '<tr class="'+ rowClass +'">';
    html += '<td>'+ player.name +'</td><td>$'+ player.dollars +'</td>';
    html += '</tr>';
  }

  html += '</table>';

  Game.dom.playerInfo.innerHTML = html;

}


UI.drawBoard = function() {

  Game.dom.board.style.width = Game.BOARD_SIZE + 'px';
  Game.dom.board.style.height = Game.BOARD_SIZE + 'px';

  for(var i=0; i<Game.boardData.length; i++){

    var position = i;
    var data = Game.boardData[i];

    if(i<10){
      var placement = 'bottom';
    } else if (i>=10 && i<20){
      var placement = 'left';
    } else if (i>=20 && i<30){
      var placement = 'top';
    } else {
      var placement = 'right';
    }

    var space = new Space(i, data.name, data.type, data.cost, data.color, position, placement, data.rent, data.group, data.house);
    Game.spaces.push(space);

    UI.drawSpace(space);

  }

}

UI.drawSpace = function(space) {

  var boardSize = Game.BOARD_SIZE;
  var size = boardSize / 11;

  if(space.placement == 'bottom') {
    var left = boardSize - (size * space.position) - size;
    var top = boardSize - size;
  } else if(space.placement == 'left') {
    var left = 0;
    var top = boardSize - (size * (space.position - 9));
  } else if(space.placement == 'top') {
    var left = (size * (space.position - 20));
    var top = 0;
  } else if(space.placement == 'right') {
    var left = boardSize - size;
    var top = (size * (space.position - 30));
  }

  var board = Game.dom.board;
  var html = board.innerHTML;
  html += '<div class="space" style="width:{0}px; height:{1}px; left:{2}px; top:{3}px; background-color: {4};" id="space-{5}"><span>{6}</span></div>'.format([size, size, left, top, space.color, space.id, space.name]);

  board.innerHTML = html;


}


UI.presentPropertyInfo = function() {

  var properties = [];

  for(var i=0; i<Game.spaces.length; i++) {
    var space = Game.spaces[i];
    if(space.type == 'property' || space.type == 'railroad' || space.type == 'utility'){
      properties.push(space);
    }
  }

  var html = '<table>';

  for(var i=0; i<properties.length; i++){
    var property = properties[i];

    var ownedBy = (property.owned) ? Game.players[property.ownedBy].name : '';

    html += '<tr>';
    html += '<td style="width:30px; background-color:{0}"></td>'.format([property.color]);
    html += '<td>{0}</td>'.format([property.name]);
    html += '<td>{0}</td>'.format([ownedBy]);
    html += '</tr>';


  }

  html += '</table>';

  Game.dom.propertyInfo.innerHTML = html;



}
