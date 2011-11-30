var io;

$(document).ready(function() {
  $('#loading-screen .message').text('Loading...');
  
  var CLICK_EVENT = ('ontouchstart' in document.documentElement) ? 'touchend' : 'click';
  
  var socket;
  
  var position = {
    in_counter: 0,
    out_counter: 0
  };
  var event = {
    counter: 0,
    capacity: 10
  };
  var undo_data = {
    in_delta: 0,
    out_delta: 0
  };
  
  $('#undo-bar .container').hide();
  
  var displayMessage, hideMessage;
  var updateCounters;
  var undo, undoClear, performedAction;
  var generateIncrementHandler, generateDecrementHandler;
  
  displayMessage = function(msg) {
    $('#loading-screen .message').text(msg).show();
  };
  hideMessage = function() {
    $('#loading-screen').hide();
  };
  
  updateCounters = function() {
    $('#in-counter .number').text(position.in_counter.toString());
    $('#out-counter .number').text(position.out_counter.toString());
    $('#total-counter .number').text(event.counter.toString());
    $('#total-counter .capacity .value').text(event.capacity);
    if(event.counter >= event.capacity) {
      if(!$('#total-counter').hasClass('over')) $('#total-counter').removeClass('close').addClass('over');
    } else if(event.counter >= event.capacity * 0.85) {
      if(!$('#total-counter').hasClass('close')) $('#total-counter').removeClass('over').addClass('close');
    } else {
      $('#total-counter').removeClass('over').removeClass('close');
    }
  };
  undo = function() {
    socket.emit('increment', -undo_data.in_delta);
    socket.emit('decrement', -undo_data.out_delta);
    position.in_counter -= undo_data.in_delta;
    position.out_counter -= undo_data.out_delta;
    event.counter -= (undo_data.in_delta - undo_data.out_delta);
    updateCounters();
    undoClear();
    return false;
  };
  undoClear = function() {
    if(undo_data.timer) {
      clearTimeout(undo_data.action_timer);
      undo_data.timer = null;
    }
    undo_data.in_delta = undo_data.out_delta = 0;
    $('#undo-bar .container').slideUp();
  };
  performedAction = function(action, amt) {
    if(action === 'increment') {
      undo_data.in_delta += amt;
    } else if(action === 'decrement') {
      undo_data.out_delta += amt;
    }
    $('#undo-bar .message').text('In: '+undo_data.in_delta+', Out: '+undo_data.out_delta);
    if(undo_data.timer) {
      clearTimeout(undo_data.timer);
    }
    undo_data.timer = setTimeout(undoClear, 7*1000);
    $('#undo-bar .container').slideDown();
  };
  generateIncrementHandler = function(amt) {
    return function() {
      position.in_counter += amt;
      event.counter += amt;
      updateCounters();
      socket.emit('increment', amt);
      performedAction('increment', amt);
      return false;
    };
  };
  generateDecrementHandler = function(amt) {
    return function() {
      position.out_counter += amt;
      event.counter -= amt;
      updateCounters();
      socket.emit('decrement', amt);
      performedAction('decrement', amt);
      return false;
    };
  };
  
  $('#add-1-button').bind(CLICK_EVENT, generateIncrementHandler(1));
  $('#add-2-button').bind(CLICK_EVENT, generateIncrementHandler(2));
  $('#add-4-button').bind(CLICK_EVENT, generateIncrementHandler(4));
  $('#sub-1-button').bind(CLICK_EVENT, generateDecrementHandler(1));
  $('#sub-2-button').bind(CLICK_EVENT, generateDecrementHandler(2));
  $('#sub-4-button').bind(CLICK_EVENT, generateDecrementHandler(4));
  
  $('#undo-button').bind('click', undo);
  
  
  $('.carousel').each(function() {
    var $this = $(this),
        $panels = $this.children('.panels'),
        $buttons = $this.children('.buttons'),
        $indicator = $buttons.children('.active-indicator');
        
    $indicator.css({
      left: $($buttons.find('.links li').get(0)).offset().left - $buttons.offset().left - 5,
      width: $($buttons.find('.links li').get(0)).width() + 10
    });
    setTimeout(function() {
      $indicator.css({
        '-webkit-transition-property': 'left, width',
        '-webkit-transition-duration': '1s, 1s'
      });
    }, 100);
    
    $buttons.find('.links li').each(function(i) {
      var $this = $(this),
          $panel = $($panels.children('li').get(i));
      $this.bind(CLICK_EVENT, function() {
        $indicator.css('left', $this.offset().left - $buttons.offset().left - 5);
        $indicator.css('width', $this.width() + 10);
        $panels.css('left', $panels.offset().left - $panel.offset().left);
      });
    });
  });
  
  
  
  var updateCounterHandler, updatePositionHandler, initializeHandler, disconnectHandler;
  
  updateCounterHandler = function(data) {
    event.counter = data.counter;
    updateCounters();
  };
  updatePositionHandler = function(data) {
    position.in_counter = data.in_counter;
    position.out_counter = data.out_counter;
    updateCounters();
  };
  initializeHandler = function(data) {
    socket.removeAllListeners('activate');
    event.counter = data.counter;
    event.capacity = data.capacity;
    position.in_counter = data.in_counter;
    position.out_counter = data.out_counter;
    updateCounters();
    socket.removeAllListeners('initialize');
    socket.on('update_counter', updateCounterHandler);
    socket.on('update_position_counter', updatePositionHandler);
    socket.on('disconnect', disconnectHandler);
    socket.on('already_logged_in', function() {
      alert('User already logged in.');
      socket.disconnect();
    });
  };
  disconnectHandler = function(data) {
    socket.removeAllListeners('deactivate');
    socket.removeAllListeners('update_counter');
    socket.removeAllListeners('update_position_counter');
    socket.on('initialize', initializeHandler);
  };
  
  socket = io.connect('http://localhost:3000');
  socket.on('error', function(e) {
    displayMessage('Unable to connect to the server: '+e);
  });
  socket.on('connect', function() {
    //setTimeout(hideMessage, 1000);
    hideMessage(); // @TODO: Switch to timeout so the screen doesn't flash
  });
  socket.on('initialize', initializeHandler);
  
  var event_id = window.location.pathname.split('/')[2];
  $('#clicker-page').hide();
  $.get('/event/'+event_id+'/positions', function(data) {
    console.log(data);
    var $buttons = $(document.createElement('div'));
    for(var i = 0; i < data.data.length; i++) {
      var $button = $(document.createElement('a'));
      $button.addClass('button').addClass('green');
      $button.text(data.data[i].title);
      $buttons.append($button);
      $buttons.append('<br/>');
      $button.click(function(position_id) {
        return function() {
          socket.emit('register', {event_id: event_id, position_id: position_id});
          $('#positions-page').hide();
          $('#clicker-page').show();
        };
      }(data.data[i]._id));
    }
    $('#positions-page').append($buttons);
  });
  
  //socket.emit('register', {name: 'Tom'});
});