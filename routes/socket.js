/*
 * Serve content over a socket
 */
var db = require('../data/neo');

var userNames = (function() {
  var names = {};

  var claim = function (name) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = true;
      return true;
    }
  };

  var getGuestName = function() {
    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name));

    return name;
  };

  var get = function() {
    var res = [],
      user;

    for (user in names) {
      res.push(user);
    }

    return res;
  };

  var free =function(name) {
    if (names[name]) {
      delete names[name];
    }
  };

  return {
    claim:claim,
    free: free,
    get: get,
    getGuestName: getGuestName
  }
}());

var queue = (function() {
  var songQueue = {
    1: {
      id: 1,
      title: "Thrift Shop",
      artist: "Macklemore",
      timestamp: new Date().getTime(),
      value: 1
    },
    2: {
      id: 2,
      title: "Ten Thousand Hours",
      artist: "Macklemore",
      timestamp: new Date().getTime(),
      value: 1
    },
    3: {
      id: 3,
      title: "White Walls",
      artist: "Macklemore",
      timestamp: new Date().getTime(),
      value: 2
    }
  };

  var add = function(song) {
    song.timestamp = new Date().getTime();
    songQueue[song.id] = song;
  }

  var remove = function(id) {
    console.log(songQueue[id]);
    delete songQueue[id];
    console.log(songQueue);
  }

  var update = function(songId, valueDelta) {
    if (!exists(songId)) {
      return false;
    }

    songQueue[songId].value += valueDelta;
    songQueue[songId].timestamp = new Date().getTime();

    return true;
  }

  var exists = function(songId) {
    return typeof songQueue[songId] !== 'undefined';
  }

  var get = function() {
    var res = [],
      song;

    for (song in songQueue) {
      res.push(songQueue[song]);
    };

    return res;
  }

  var getSong = function(id) {
    return songQueue[id];
  }

  return {
    add: add,
    update: update,
    remove: remove,
    exists: exists,
    get: get,
    getSong: getSong
  }

}());



var goQueue = function(socket, user) {
  socket.emit('queue:init', {
    queue: queue.get()
  });

  // we're updating a song -- could be either positive or negative...
  // todo: check if song is in queue
  socket.on('queue:update', function(data, clientCallback) {
    var song, //song after updated
      verb = ""; // action taken (bumped/knocked)

    verb = data.valueDelta > 0 ? "bumped" : "knocked";

    if ( queue.update(data.id, data.valueDelta) ) {
      song = queue.getSong(data.id);

      clientCallback(true);

      if (song.value > 0) {

        socket.broadcast.emit('queue:update',  {
          song: queue.getSong(data.id)
        });


        socket.broadcast.emit('send:message', {
          user: user.name,
          text: verb + " " + song.title + " by " + data.valueDelta + " tokens"
        });

      } else {
        queue.remove(song.id);

        socket.broadcast.emit('queue:delete', {
          id: song.id
        });
      }
    } else {
      clientCallback( false );
    }

  });

  // we're adding a song -- returns false if song is already in queue
  socket.on('queue:new', function(data, clientCallback) {
    if (!queue.getSong(data.id)) {
      queue.add(data);

      socket.broadcast.emit('queue:update', {
        user: user.name,
        song: queue.getSong(data.id)
      });

      clientCallback(true);
    } else {
      clientCallback(false);
    }
  });
}




var goChat = function (socket, user) {
  user.name = userNames.getGuestName();

  socket.emit('chat:init', {
    user: user.name,
    users: userNames.get()
  });

  socket.broadcast.emit('user:join', {
    name: user.name
  });

  socket.on('send:message', function (data) {
    socket.broadcast.emit('send:message', {
      user: user.name,
      text: data.message
    });
  });

  socket.on('change:name', function (data, fn) {
    if (userNames.claim(data.name)) {
      var oldName = user.name;
      userNames.free(oldName);

      user.name = data.name;

      socket.broadcast.emit('change:name', {
        oldName: oldName,
        newName: user.name
      });

      fn(true);
    } else {
      fn(false);
    }
  });

  socket.on('disconnect', function () {
    console.log('DISCONNECTING!');

    socket.broadcast.emit('user:left', {
      name: user.name
    });

    userNames.free(user.name);
  });
};

var createNeoSockets = function(socket) {
  socket.on('query:availableRaces', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:availableRaces', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };

    db.GetAvailableRaces(onQueryCompletion);
  });

  socket.on('query:allDonors', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:allDonors', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };
    var params = {
      title: "Governor",
      period: "2010-2012"
    };

    db.GetAllDonors(data, onQueryCompletion);
  });

  socket.on('query:allDonorsMeta', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:allDonorsMeta', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };
    var params = {
      title: "Governor",
      period: "2010-2012"
    };

    db.GetAllDonorsMeta(data, onQueryCompletion);
  });

  socket.on('query:hedgers', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:hedgers', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };

    db.GetHedgers(data, onQueryCompletion);
  });

  socket.on('query:hedgersMeta', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:hedgersMeta', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };

    db.GetHedgersMeta(data, onQueryCompletion);
  });
  socket.on('query:donorDonations', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:donorDonations', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };

    db.GetDonorDonations(data, onQueryCompletion);
  });
  socket.on('query:donorDonationsMeta', function( data, cb ) {
    var onQueryCompletion;

    onQueryCompletion = function onQueryCompletionFn( data ) {
      socket.emit('data:donorDonationsMeta', data, function() {
        console.log('ACKNOWLEDGED');
      });
    };

    db.GetDonorDonationsMeta(data, onQueryCompletion);
  });
};

module.exports = function(socket) {
  createNeoSockets(socket);
};

