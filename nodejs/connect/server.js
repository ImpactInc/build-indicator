var io = require('socket.io')();
io.on('connection', function(socket){
  var i = 0;
  setInterval(function() {
    socket.emit('news', {
      message: i++
    });
  }, 1000);
});
io.listen(3000);
