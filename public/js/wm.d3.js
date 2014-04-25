/* global angular:false */
angular.module('wm.d3', ['btford.socket-io'])
.factory('Viz', ['$q', 'API', function($q, API) {
  var 
    records = {},
    setData;

  setData = function setDataFn( results ) {
    records.data = results.data;
    records.columns = results.columns;
  };

  return {
    load: API,
    records: records
  };
}])
.factory('API', [ '$q', 'Socket', function($q, Socket) {
  var
    meta,
    race,
    donor;

  function createSocketCall(queryDescription, processParams) {
    var
      deferred;

    if (!processParams) {
      processParams = function(params) {
        return params;
      };
    }

    //set up receive records
    Socket.on(queryDescription + ':data', function(results) {
      deferred.resolve(results);
    });

    return function requestRecordsFromServerFn(parameters) {
      if (!parameters) {
        parameters = {};
      }

      Socket.emit(queryDescription + ':query', processParams(parameters));

      deferred = $q.defer();
      return deferred.promise;
    };
  }

  meta = {
    availableRaces: createSocketCall('meta:availableRaces')
  };

  race = {
    allDonors: createSocketCall('race:allDonors'),
    allDonorsMeta: createSocketCall('race:allDonorsMeta'),
    hedgers: createSocketCall('race:hedgers'),
    hedgersMeta: createSocketCall('race:hedgersMeta')
  };

  donor = {
    donations: createSocketCall('donor:donations'),
    donationsMeta: createSocketCall('donor:donationsMeta')
  };

  return {
    meta: meta,
    donor: donor,
    race: race
  };
}])
.constant('COLORS', {
  blues: [
    '1F75FE', //blue crayola
    '89CFF0', //baby blue
    '0000ff', //blue RGB
    '0018A8', //blue pantone
    'CCCCFF', //periwinkle
    '333399', //blue CMYK
    'B0E0E6', //powder blue
    '545AA7'  //liberty
  ],
  reds: [
    'FF0000', //red
    '960018', //carmine
    'DC143C', //crimson
    'F88379', //coral pink
    'ED2939'  //imperial red
  ],
  greens: [
    '568203', //avocado
    '74c365', //mantis
    '006400', //dark green
    '90EE90', //light green
    '228B22'  //forest green
  ],
  yellows: []
})
.controller('VizParamsCtrl', function VizParamsCtrlFn($scope, Viz) {
  var 
    NONE_AVAILABLE = 'N/A',
    ar = [];

  // Viz.load.availableRaces.request().then(function(results) {
    console.log(Viz);
  Viz.load.meta.availableRaces().then(function(results) {
    ar = results.data;
    $scope.title = '';
  });

  $scope.$watch('title+county+district+period', function(n, o, wscope) {

    var vizParams = {
      title: wscope.title === NONE_AVAILABLE ? null : wscope.title,
      county: wscope.county === NONE_AVAILABLE ? null : wscope.county,
      district: wscope.district === NONE_AVAILABLE ? null : wscope.district,
      period: wscope.period === NONE_AVAILABLE ? null : wscope.period
    };

    function nullField(params, field) {
      var copy = angular.copy(params);

      copy[field] = null;

      return copy;
    }

    wscope.titles = getPossibles('title', nullField(vizParams, 'title'));
    wscope.counties = getPossibles('county', nullField(vizParams, 'county'));
    wscope.districts = getPossibles('district', nullField(vizParams, 'district'));
    wscope.periods = getPossibles('period', nullField(vizParams, 'period'));
  });

  function getPossibles( lval, params ) {
    var i,
      currentOffice,
      currentVal,
      discovered = {},
      possibles = [NONE_AVAILABLE];

    if (!ar.length) {
      return [];
    }

    for (i = 0; i < ar.length; i++) {
      currentOffice = ar[i][0];

      if (params && !matchOffice(currentOffice, params)) {
        continue;
      }

      if (lval === 'period') {
        currentVal = ar[i][1];
      } else {
        currentVal = currentOffice[lval];
      }


      if (currentVal && !discovered[currentVal]) {
        discovered[currentVal] = true;
      }
    }

    angular.forEach(discovered, function(value, key) {
      possibles.push(key);
    });

    return possibles;
  }

  function matchOffice(office, params) {
    if (params.title && office.title !== params.title) {
      return false;
    }
    if (params.county && office.county !== params.county) {
      return false;
    }
    if (params.county && office.county !== params.county) {
      return false;
    }
    if (params.district && office.district !== params.district) {
      return false;
    }

    return true;
  }

/*
  senate->district->period
  house->district->period
  governor->period
  mayor->county->period
  xxx council->district->period
  BOE->district->period 
  */
});