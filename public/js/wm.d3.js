angular.module('wm.d3', ['btford.socket-io'])
.factory('Viz', ['$q', 'API', function($q, API) {
  var 
    records = {},
    load = {},
    availableRaces = {}
    setData;

  function createResultsFn( deferred ) {
    return function setDataFn( results ) {
      records.data = results.data;
      records.columns = results.columns;
      deferred.resolve();
    };
  }

  var allDonorsDeferred = $q.defer();
  API.allDonors.setResultsCb(createResultsFn(allDonorsDeferred));

  load.allDonors = {
    promise: allDonorsDeferred.promise,
    request: API.allDonors.requestRecords
  };

  var hedgeDeferred = $q.defer();
  API.hedgers.setResultsCb(createResultsFn(hedgeDeferred));

  load.hedgers = {
    promise: hedgeDeferred.promise,
    request: API.hedgers.requestRecords
  };

  return {
    load: load,
    records: records
  };
}])
.factory('API', [ 'Socket', function(Socket) {

  var emptyCallback = function emptyCallbackFn() {
    console.log("no callback has been set for this socket call");
  }

  function createSocketCall(queryId, processParams) {
    var
      requestCb = emptyCallback,
      resultsCb = emptyCallback,
      // functions
      requestRecords,
      setRequestCb,
      setResultsCb;

    if (!processParams) {
      processParams = function(params) {
        return params;
      };
    }

    requestRecords = function(parameters) {
      if (!parameters) {
        parameters = {};
      }

      parameters = processParams(parameters);

      Socket.emit('query:' + queryId, parameters, function(acknowledgement) {
        requestCb(acknowledgement);
      });
    };

    //set up receive records
    Socket.on('data:' + queryId, function(results) {
      resultsCb(results);
    });

    return {
      requestRecords: requestRecords,
      setRequestCb: function(newRequestCb) { requestCb = newRequestCb; },
      setResultsCb: function(newResultsCb) { resultsCb = newResultsCb; }
    };
  }

  var allDonorsQuery = createSocketCall('allDonors');
  var availableRacesQuery = createSocketCall('availableRaces');
  var hedgersQuery = createSocketCall('hedgers');

  return {
    availableRaces: availableRacesQuery
    allDonors: allDonorsQuery,
    hedgers: hedgersQuery
  }
}])
.constant('COLORS', {
  blues: [
    "1F75FE", //blue crayola
    "89CFF0", //baby blue
    "0000ff", //blue RGB
    "0018A8" //blue pantone
  ],
  reds: [
    "FF0000", //red
    "960018", //carmine
    "DC143C" //crimson
  ],
  greens: [],
  yellows: []
});