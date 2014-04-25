/*
 * Serve content over a socket
 */
var db = require('../data/neo');

var createNeoSockets = function(socket) {

  function createSocketConnection(queryDescription, dbQueryFn, cb) {
    socket.on(queryDescription + ':query', function(params) {
      var onQueryCompletion = function onQueryCompletionFn(data) {
        socket.emit(queryDescription + ':data', data, function(ackMessage) {
          console.log('Data transmission acknowledged: ' + ackMessage);
        });
      };

      dbQueryFn(params, onQueryCompletion);
    });
  }

  createSocketConnection('meta:availableRaces', db.GetAvailableRaces);
  createSocketConnection('race:allDonors', db.GetAllDonors);
  createSocketConnection('race:allDonorsMeta', db.GetAllDonorsMeta);
  createSocketConnection('race:hedgers', db.GetHedgers);
  createSocketConnection('race:hedgersMeta', db.GetHedgersMeta);
  createSocketConnection('donor:donations', db.GetDonorDonations);
  createSocketConnection('donor:donationsMeta', db.GetDonorDonationsMeta);
};

module.exports = function(socket) {
  createNeoSockets(socket);
};

