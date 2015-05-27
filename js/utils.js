/* UTILITY */

Utils = {};

Utils.randomInt = function(min, max){

  return Math.floor( Math.random() * (max + 1 - min) + min );

}

Utils.loadJson = function(path, success, error) {

  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              if (success){
                success(JSON.parse(xhr.responseText));
              }
          } else {
              if (error){
                error(xhr);
              }
          }
      }
  };

  xhr.open("GET", path, true);
  xhr.send();

}

Utils.shuffleArray = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
