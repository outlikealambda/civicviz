angular.module('wm.donut', ['wm.d3'])
.directive('donutBuilder', [ '$window', 'Viz', 'COLORS', function($window, Viz, COLORS) {
  var 
    // constants
    MIN_HEIGHT = 500,
    MIN_WIDTH = 500,
    STD_RADIUS = 200,
    // functions
    colorize,
    getAllRaceDonations,
    sort;

  function sizeSvg() {
    return {
      width: $window.innerWidth > MIN_WIDTH ? $window.innerWidth : MIN_WIDTH,
      height: $window.innerHeight > MIN_HEIGHT ? $window.innerHeight : MIN_HEIGHT
    };
  }


  colorize = function() {
    var 
      used = {},
      getColor,
      nextColor,
      getAllRaceDonations;

    getColor = function(party, regNo) {
      if (!used[party] || !used[party][regNo]) {
        return assignColor(party, regNo);
      }

      return used[party][regNo];
    };

    function assignColor(party, regNo) {
      if (!used[party]) {
        used[party] = {};
      }

      used[party][regNo] = nextColor(party);
      return used[party][regNo];
    }

    nextColor = function() {
      partyIndex = {
        democrat: 0,
        republican: 0,
        other: 0
      };

      return function(party) {
        var color;

        switch(party) {
          case "Democrat":
            color = COLORS.blues[partyIndex.democrat];
            partyIndex.democrat++;
            partyIndex.democrat = partyIndex.democrat % 7;
            break;
          case "Republican":
            color = COLORS.reds[partyIndex.republican];
            partyIndex.republican++;
            partyIndex.republican = partyIndex.republican % 5;
            break;
          default: 
            color = COLORS.greens[partyIndex.other];
            partyIndex.other++;
            partyIndex.other = partyIndex.other % 5;
            console.log("unknown party: ", party);
            break;
        }

        return color;
      };
    }();

    return getColor;
  }();

  getAllRaceDonations = function(d) {
    var i,
      donations = [];

    for( i = 0; i < Viz.records.data.length; i++ ) {
      if (Viz.records.data[i][0].personId === d[0].personId) {
        donations.push(Viz.records.data[i]);
      }
    }

    return donations;
  };

  sort = function() {
    var
      byCommittee,
      byDonor;

    byCommittee = function byCommitteeFn(a, b) {
      // sort by committee and then by value 
      if (a[1].regNo !== b[1].regNo) {
        return a[1].regNo < b[1].regNo? -1 : 1;
      }

      return a[0].lastName < b[0].lastName ? -1 : a[0].lastName > b[0].lastName ? 1 : 0;
    };

    return {
      byCommittee: byCommittee
    };
  }();

  var go = {};

  go.allDonors = {
    isActive: false,
    go: function(index, bbox) {
      var params = {
        title: "Mayor",
        county: "Maui",
        period: "2010-2012"
      };

      Viz.load.race.allDonors(params).then(function(results) {
        var donut = createDonut(bbox, null, null);

        donut.update(0, results.data);


        donutStacker.popStackAndAddNew(donut, index);
      });
    }
  };

  go.hedgers = {
    isActive: false,
    go: function() {
      // clearInnerArc();
      // if (!scope.hedgers.isActive) {
      //   Viz.load.hedgers.request(params).then(function() {
      //     populateOuterArc(Viz.records.data);
      //   });
      //   Viz.load.hedgersMeta.request(params).then(function(results) {
      //     var i,
      //       committee;

      //     scope.meta = results;
      //     for ( i = 0; i < scope.meta.data.length; i++ ) {
      //       committee = scope.meta.data[i][0];
      //       committee.color = colorize(committee.party, committee.regNo);
      //     }
      //   });
      //   scope.hedgers.isActive = true;
      //   scope.allDonors.isActive = false;
      // }
    }
  };
  function createDonut(donutParent, wedgeValueFn, wedgeSortFn) {
    // STATE:
    // index
    // data
    var 
      donutData,
      donutIndex,
      group,
      pie,
      //function
      updateDonut,
      clearDonut;

    wedgeValueFn = wedgeValueFn || function() { return 1; };
    wedgeSortFn = wedgeSortFn || null;

    donutData = [];
    donutIndex = 0;
    group = donutParent.append("g");

    pie = d3.layout.pie()
      .sort(wedgeSortFn)
      .value(wedgeValueFn);

    updateDonut = function updateDonutFn(index, data, wedgeSortFn, wedgeValueFn) {
      var
        GEOMETRIC_BASE = 0.8,
        arcs,
        arcGenerator,
        widthModifier;

      if (index) {
        donutIndex = index;
      }

      if (data) {
        // console.log(data);
        donutData = data;
      }

      if (typeof wedgeSortFn === 'function') {
        pie.sort(wedgeSortFn);
      }

      if (typeof wedgeValueFn === 'function') {
        pie.value(wedgeValueFn);
      }

      widthModifier = Math.pow(GEOMETRIC_BASE, donutIndex);

      // used to create the arc for each path
      arcGenerator = d3.svg.arc()
        .outerRadius(STD_RADIUS + 100*(1 - widthModifier)/(1 - GEOMETRIC_BASE))
        .innerRadius(STD_RADIUS + 100*(1 - widthModifier)/(1 - GEOMETRIC_BASE) - 90*widthModifier);

      // returns the actionable data selection
      arcs = group.selectAll(".arc")
        .data(pie(donutData));

      // add path DOM elements for any new data 
      arcs.enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", d3.svg.arc().outerRadius(10).innerRadius(1))
        .style("fill", function(d) { 
          return donutIndex * 111111 + '';
        })
        .on('click', function() {
          go.allDonors.go(donutIndex, donutParent);
        });

      // for any updated elements, redraw the arc
      arcs.transition().duration(1000)
        .attr("d", arcGenerator);

      // remove dropped elements
      arcs.exit().remove();

      console.log(arcs);
    };

    clearDonut = function clearDonutFn() {
      console.log("pre-clear",group.selectAll(".arc"));
      group.selectAll(".arc").data([]).exit()
        .transition().duration(800)
        .attr("d", d3.svg.arc().outerRadius(0).innerRadius(0))
        .remove();
    };

    return {
      clear: clearDonut,
      update: updateDonut
    };
  }

  var donutStacker = function() {
    var donutStack = []; // array of active donuts

    /**
     *
     */    
    function addToStackAtIndex(donut, index) {
      donutStack.splice(index, 0, donut);
    }

    function popStack(index) {
      var i;

      removedDonuts = donutStack.splice(0, index);

      for (i = 0; i < removedDonuts.length; i++) {
        removedDonuts[i].clear();
      }
    }

    function updateStack() {
      var i;

      for (i = 0; i < donutStack.length; i++)  {
        donutStack[i].update(i);
      }
    }

    return {
      popStackAndAddNew: function popStackAndAddNewFn(donut, index) {
        popStack(index);
        addToStackAtIndex(donut, 0);
        updateStack();
      }
    };
  }();
  
  return {
    templateUrl: 'partials/donut',
    link: function(scope, elem, attrs) {
      var
        svg,
        bbox,
        params,
        // 
        activeZoom,
        panZoom;

      vizOptions = [
        {
          buttonText: "",
          isActive: true,
          go: function() {

          }
        }
      ];
      activeZoom = {
        translate : [0, 0],
        scale : 1
      };

      panZoom = function panZoomFn() {
        activeZoom.translate = d3.event.translate;
        activeZoom.scale = d3.event.scale;

        bbox 
          .attr( "transform",
                 "translate(" + d3.event.translate + ")" +
                 "scale(" + d3.event.scale + ")" );
      };

      function init() {
        var bounds = sizeSvg(),
          radius = Math.min(bounds.width, bounds.height) / 2 - 20;

        zoom = d3.behavior.zoom().on( "zoom", panZoom );

        svg = d3.select(elem[0]).append("svg:svg")
          .attr("width", bounds.width)
          .attr("height", bounds.height)
          .attr("viewBox", (-bounds.width/2) + " " + (-bounds.height/2) + " " + bounds.width + " " + bounds.height)
          .attr("preserveAspectRatio", "xMidYMid")
          .call( zoom );    

        bbox = svg.append("g").attr("class", "bbox");
      }

      // viz switching
      scope.allDonors = go.allDonors;

      scope.hedgers = go.hedgers;

      scope.clearInnerArc = function() {
        clearInnerArc();
      };

      scope[attrs.onSubmit] = function(title, county, district, period) {
        params = {
          title: title === "N/A" ? null : title,
          county: county === "N/A" ? null : county,
          district: district === "N/A" ? null : district,
          period: period === "N/A" ? null : period
        };

        if (scope.allDonors.isActive) {
          scope.allDonors.isActive = false;
          scope.allDonors.go();
        } else {
          scope.hedgers.isActive = false;
          scope.hedgers.go();
        }
      };

      //finally, go
      init();

      params = {
        title: "Mayor",
        county: "Maui",
        period: "2010-2012"
      };
      scope.testAdd = function() {
        go.allDonors.go(0, bbox);
      };

      scope.testAdd();
    }
  };
}]);