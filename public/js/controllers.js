'use strict';

/* Controllers */
angular.module('myApp.controllers', []).controller('TestSocketCtrl', function( $scope, Socket ) {
  $scope.message = "pinged";
  $scope.payloadSize = 0;

  Socket.emit('test:ping', { message: "pinging" }, function payloadCb( payload ) {
    console.log("callback");
    // $scope.payloadSize = payload.id;
  });

  Socket.on('test:payload', function( data ) {
    console.log(data);
    $scope.payloadSize = data.length;
    // console.log($scope.payloadSize);
  });

});

function AppCtrl($scope, socket, $timeout) {

  $scope.messages = [];

  socket.on('queue:init', function( data ) {
    $scope.queue = data.queue;
  });

  var updateQueue = function(song) {
    var i; // queue index

    for ( i = 0; i < $scope.queue.length; ++i ) {
      if ($scope.queue[i].id === song.id) {
        $scope.queue[i].value = song.value;
        $scope.queue[i].timestamp = song.timestamp;
        break;
      }
    }
  }

  var deleteFromQueue = function(id) {
    var i; // queue index

    for ( i = 0; i < $scope.queue.length; ++i ) {
      if ( $scope.queue[i].id === id ) {
        $scope.queue.splice(i, 1);
        break;
      }
    }
  }

  socket.on('queue:update', function( data ) {
    updateQueue(data.song);
  });

  socket.on('queue:delete', function( data ) {
    deleteFromQueue(data.id);
  });

  socket.on('chat:init', function( data ) {
    $scope.name = data.name;
    $scope.users = data.users;
  });

  socket.on('send:message', function ( message ) {
    newMessage( message.user, message.text );
  });

  socket.on('change:name', function ( data ) {
    changeName( data.oldName, data.newName );
  });

  socket.on('user:join', function ( data ) {
    newMessage( 'chatroom', data.name + 'has joined');

    $scope.users.push( data.name );
  });

  socket.on('user:left', function(data) {
    console.log('DISCONNECTING!');

    newMessage( 'chatroom', data.name + ' has left.');

    var i, user;

    for ( i = 0; i < $scope.users.length; ++i ) {
      user = $scope.users[i];
      if ( user === data.name ) {
        $scope.users.splice( i, 1 );
        break;
      }
    }
  });

  var changeName = function( oldName, newName ) {
    var i;

    for ( i = 0; i < $scope.users.length; ++i ) {
      if ( $scope.users[i] === oldName ) {
        $scope.users[i] = newName;
      }
    }

    newMessage( 'chatroom', oldName + ' changed their name to ' + newName );
  };

  var idGenerator = (function() {
    var id = 0;

    return {
      next: function() {
        return ++id;
      }
    }
  }());

  var deleteMessage = function(id) {
    var i; // index for messages

    for ( i = 0; i < $scope.messages.length; ++i) {
      if ($scope.messages[i].id === id) {
        $scope.messages.splice(i, 1);
      }
    }
  }

  var newMessage = function( userName, message, duration ) {
    var newId = idGenerator.next();
    duration = duration ? duration * 1000 : 1000;
    duration = duration > 0 ? duration : duration * -1;

    $scope.messages.push({
      id: newId,
      user: userName,
      text: message
    });

    $timeout( function() {deleteMessage(newId);}, duration);
  }

  $scope.changeName = function() {
    socket.emit('change:name', {
      name: $scope.newName
    }, function(result) {
      if (!result) {
        alert('there was an error changing your name');
      } else {

        changeName($scope.name, $scope.newName);

        $scope.name = $scope.newName;
        $scope.newName = '';
      }
    });
  };

  $scope.sendMessage = function() {
    socket.emit('send:message', {
      message: $scope.message
    });

    newMessage( $scope.name, $scope.message );

    $scope.message = '';

  }

  $scope.songUpdate = function(song, valueDelta) {
    var vDelt = parseInt(valueDelta);

    if (!angular.isNumber(vDelt) || isNaN(vDelt)) {
      return;
    }

    var updateCallback = function(success) {
      console.log('in callback');
      if (success) {
        newMessage( 'chatroom', 'you changed ' + song.title + ' by ' + vDelt, vDelt);

        console.log(song);

        song.value += vDelt;

        if (song.value <= 0) {
          deleteFromQueue(song.id);
        }
      } else {
        newMessage('server', 'sorry, we were unable to update ' + song.title + ' by ' +song.artist);
      }
    }

    socket.emit('queue:update', {
      id: song.id,
      valueDelta: vDelt
    }, updateCallback);
  }

  $scope.newSong = function(newTrack) {
    var newSongCallback = function(success, song) {

    }
  }
}

function NewTrackCtrl($scope, socket) {
  $scope.newTrack = {
    value: 1
  }

  $scope.valuePlus = function() {
    $scope.newTrack.value += 1;
  }

  $scope.valueMinus = function() {
    $scope.newTrack.value -= 1;
  }
}

