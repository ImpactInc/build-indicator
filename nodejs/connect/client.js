function testOne() {
  var socket = require('socket.io-client')('http://192.168.17.197:3000', {forceNew: true});
  socket.on('connect', function(){
    socket.on('news', function(data){
      console.log(data.message);
    });
  });
}

for (var i = 0; i < 5; i++) {
  testOne();
}
