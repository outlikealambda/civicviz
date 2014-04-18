angular.module('wmd3', ['btford.socket-io'])
.factory('Viz', ['API', function(API) {
  var 
    records = {},
    load = {},
    setData;

  setRecords = function setDataFn( results ) {
    records.data = results.data;
    records.columns = results.columns;
  };

  API.hedges.setResultsCb(setRecords);

  load.hedges = API.hedges.requestRecords;

  return {
    load: load,
    records: records
  };
}])
.factory('API', [ 'Socket', function(Socket) {

  var emptyCallback = function emptyCallbackFn() {
    console.log("no callback has been set for this socket call");
  }

  var hedgeQuery = (function() {
    var
      requestCb = emptyCallback,
      resultsCb = emptyCallback,
      // functions
      requestRecords,
      setRequestCb,
      setResultsCb;

    requestRecords = function() {
      Socket.emit('test:ping', { message: "pinging" }, requestCb);
    };

    //set up receive records
    Socket.on('test:payload', function(results) {
      resultsCb(results);
    });

    return {
      requestRecords: requestRecords,
      setRequestCb: function(newRequestCb) { requestCb = newRequestCb; },
      setResultsCb: function(newResultsCb) { resultsCb = newResultsCb; }
    };
  }());

  console.log(hedgeQuery);

  return {
    hedges: hedgeQuery
  }
}]);