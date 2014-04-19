angular.module('wm.donut', ['wm.d3'])
.directive('donutBuilder', [ '$window', 'Viz', 'COLORS', function($window, Viz, COLORS) {
  var 
    // constants
    MIN_HEIGHT = 500,
    MIN_WIDTH = 500,
    RADIUS = 500,
    colorize,
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
    }

    function assignColor(party, regNo) {
      if (!used[party]) {
        used[party] = {};
      }

      return used[party][regNo] = nextColor(party);
    }

    nextColor = function() {
      partyIndex = {};

      return function(party) {
        var color;

        if (!partyIndex[party]) {
          partyIndex[party] = 0;
        }

        switch(party) {
          case "Democrat":
            color = COLORS.blues[partyIndex.Democrat];
            break;
          case "Republican":
            color = COLORS.reds[partyIndex.Republican];
            break;
          default: 
            color = "#00FF00";
            console.log("unknown party: ", party);
            break;
        }

        partyIndex[party]++;

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
    }

    return {
      byCommittee: byCommittee
    };
  }();

  
  return {
    link: function(scope, elem, attrs) {
      var
        arc,
        pie,
        svg,
        bbox,
        g,
        // 
        activeZoom,
        panZoom;

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
        var bounds = sizeSvg();

        arc = d3.svg.arc()
          .outerRadius(RADIUS - 10)
          .innerRadius(RADIUS - 70);

        pie = d3.layout.pie()
          .sort(sort.byCommittee)
          .value(function(d) { return d[3]; });

        zoom = d3.behavior.zoom().on( "zoom", panZoom );

        svg = d3.select(elem[0]).append("svg:svg")
          .attr("width", bounds.width)
          .attr("height", bounds.height)
          .attr("viewBox", "0 0 " + bounds.width + " " + bounds.height)
          .attr("preserveAspectRatio", "xMidYMid")
          .call( zoom );    

        bbox = svg.append("g");
      }

      function populate(data) {
        g = bbox.selectAll(".arc")
          .data(pie(data))
          .enter().append("g")
          .attr("class", "arc")
          .on("mouseover", function(d) {
            scope.$apply(scope.details = getAllRaceDonations(d.data));
          });

        g.append("path")
          .attr("d", arc)
          .style("fill", function(d) { 
            return colorize(d.data[1].party, d.data[1].regNo); 
          });
      }

      Viz.load.allDonors.request();
      Viz.load.allDonors.promise.then(function() {
        init();
        populate(Viz.records.data);
      });
    }
  };
}]);