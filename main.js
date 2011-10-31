$(document).ready(function() {
  var socket = io.connect('http://64.34.218.23:8080');
  $('#incr_button').click(function() {
    socket.emit('increment');
    return false;
  });
  $('#decr_button').click(function() {
    socket.emit('increment');
    return false;
  });
  
  socket.on('update', function(count) {
    $('#number').text(count);
  });
});