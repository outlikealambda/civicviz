angular.module('wm.donut', ['wm.d3'])
.directive('donutBuilder', [ '$window', 'Viz', 'COLORS', function($window, Viz, COLORS) {
  var 
    // constants
    MIN_HEIGHT = 500,
    MIN_WIDTH = 500,
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
    }

    function assignColor(party, regNo) {
      if (!used[party]) {
        used[party] = {};
      }

      return used[party][regNo] = nextColor(party);
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
    }

    return {
      byCommittee: byCommittee
    };
  }();

  
  return {
    templateUrl: 'partials/donut',
    link: function(scope, elem, attrs) {
      var
        arc,
        pie,
        innerPie,
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
      ]
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

        arc = d3.svg.arc()
          .outerRadius(radius - 10)
          .innerRadius(radius - 90);

        innerArc = d3.svg.arc()
          .outerRadius(radius - 110)
          .innerRadius(radius - 200);

        pie = d3.layout.pie()
          .sort(sort.byCommittee)
          .value(function(d) { return d[3]; });

        innerPie = d3.layout.pie()
          .sort(null)
          .value(function(d) { return d[2].amount; })

        zoom = d3.behavior.zoom().on( "zoom", panZoom );

        svg = d3.select(elem[0]).append("svg:svg")
          .attr("width", bounds.width)
          .attr("height", bounds.height)
          .attr("viewBox", (-bounds.width/2) + " " + (-bounds.height/2) + " " + bounds.width + " " + bounds.height)
          .attr("preserveAspectRatio", "xMidYMid")
          .call( zoom );    

        bbox = svg.append("g");
      }

      function populateOuterArc(data) {
        var gArcs;

        // bbox.selectAll(".arc").data([]).exit().remove();

        gArcs = bbox.selectAll(".arc")
          .data(pie(data));

        gArcs.enter()
          .append("path")
          .attr("class", "arc")
          .on("mouseover", function(d) {
            scope.$apply(scope.details = getAllRaceDonations(d.data));
          })
          .on("mouseleave", function() {
            scope.$apply(scope.details = null);
          })
          .on("click", function(d) {
            getIndividualDonations(d.data[0].personId);
          });

        gArcs
          .style("fill", function(d) { 
            return colorize(d.data[1].party, d.data[1].regNo); 
          })
          .transition().duration(1000)
          .attr("d", arc);

        gArcs.exit().remove();
      }

      function getIndividualDonations(id) {
        var params = {
          personId: id
        };

        clearInnerArc();

        Viz.load.donorDonations.request(params).then(function(results) {
          populateInnerArc(results.data);
        });

        Viz.load.donorDonationsMeta.request(params).then(function(results) {
          var i,
            donationTotal = 0,
            committee;

          scope.donationMeta = results.data;
          for ( i = 0; i < scope.donationMeta.length; i++ ) {
            committee = scope.donationMeta[i][1];
            committee.color = colorize(committee.party, committee.regNo);
            donationTotal += scope.donationMeta[i][2];
          }

          scope.donationTotal = donationTotal;
        });
      }

      function populateInnerArc(data) {
        var gArcs;


        gArcs = bbox.selectAll(".inner-arc")
          .data(innerPie(data));

        gArcs.enter()
          .append("path")
          .attr("class", "inner-arc")
          // on something
          .on("mouseover", function(d) {
            scope.$apply(scope.donation = d.data);
          })
          .on("mouseleave", function() {
            scope.$apply(scope.donation = null);
          });

        gArcs.style("fill", function(d) {
            return colorize(d.data[1].party, d.data[1].regNo); 
          })
          .transition().duration(1000)
          .attr("d", innerArc)
      }

      function clearInnerArc() {
        bbox.selectAll(".inner-arc").data([]).exit().remove();

        scope.donationMeta = null;
        scope.donationTotal = null;
      }

      // viz switching
      scope.allDonors = {
        isActive: false,
        go: function() {
          clearInnerArc();
          console.log(params);
          if (!scope.allDonors.isActive) {
            Viz.load.allDonors.request(params).then(function() {
              populateOuterArc(Viz.records.data);
            });
            Viz.load.allDonorsMeta.request(params).then(function(results) {
              var i,
                committee;

              scope.meta = results;
              for ( i = 0; i < scope.meta.data.length; i++ ) {
                committee = scope.meta.data[i][0];
                committee.color = colorize(committee.party, committee.regNo);
              }
            });
            scope.allDonors.isActive = true;
            scope.hedgers.isActive = false;
          }
        }
      };

      scope.hedgers = {
        isActive: false,
        go: function() {
          clearInnerArc();
          if (!scope.hedgers.isActive) {
            Viz.load.hedgers.request(params).then(function() {
              populateOuterArc(Viz.records.data);
            });
            Viz.load.hedgersMeta.request(params).then(function(results) {
              var i,
                committee;

              scope.meta = results;
              for ( i = 0; i < scope.meta.data.length; i++ ) {
                committee = scope.meta.data[i][0];
                committee.color = colorize(committee.party, committee.regNo);
              }
            });
            scope.hedgers.isActive = true;
            scope.allDonors.isActive = false;
          }
        }
      };

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
      }

      //finally, go
      init();

      params = {
        title: "Mayor",
        county: "Honolulu",
        period: "2010-2012"
      };

      scope.allDonors.go();
    }
  };
}]);