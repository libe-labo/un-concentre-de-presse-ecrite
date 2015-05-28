'use strict';

angular.module('app').directive('bubbles', [function() {
    var colorFromString = function(str) {
        str = str || '';

        var i, hash;
        i = hash = 0;
        while (i < str.length) {
            hash = str.charCodeAt(i++) + ((hash << 5) - hash);
        }

        var colour = '#';
        for (i = 0; i < 3; ++i) {
            var part = (hash >> i * 8) & 0xFF;
            part = Math.max(Math.min(part, 200), 50);
            colour += ('00' + part.toString(16)).slice(-2);
        }
        return colour;
    };

    var computeNodes = function(data, clusterBy) {
        var nodes = _.map(data, function(d) {
            return {
                id : d.id,
                name : d.name,
                r : 12,
                x : 0,
                y : 0,
                fill : colorFromString(clusterBy(d)),
                cluster : clusterBy(d)
            };
        });

        return nodes;
    };

    var getClusterCenter = function(data, clusterBy, width, height) {
        var clusters = _(data).map(d3.f('cluster')).groupBy().map(function(d, k) {
            return {
                name : k,
                value : d.length
            };
        }).value();

        var map = d3.layout.pack().size([width, height]);
        map.nodes({ children : clusters });
        clusters = _.indexBy(clusters, 'name');

        return clusters;
    };

    return {
        restrict : 'EA',
        scope : {
            data : '='
        },
        templateUrl : 'directives/bubbles/bubbles.html',
        link : function($scope, element) {
            var svg = angular.element(element).find('div.d3');

            var padding = {
                top : 100,
                right : 100,
                bottom : 100,
                left : 100
            };
            var width = svg.width();
            var height = svg.height();

            svg = d3.select(svg.get(0))
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height);

            width = width - padding.left - padding.right;
            height = height - padding.top - padding.bottom;
            svg = svg.append('g')
                     .attr('width', width)
                     .attr('height', height)
                     .translate([padding.left, padding.top]);


            var force = d3.layout.force();
            var charge = function(d) {
                return -Math.pow(d.r, 2.0) / 3;
            };

            // Switches
            $scope.switches = [
                '2008',
                '2015'
            ];

            $scope.activateSwitch = function(theSwitch) {
                if ($scope.switches.indexOf(theSwitch) >= 0) {
                    $scope.activeSwitch = theSwitch;
                }
            };

            $scope.activateSwitch($scope.switches[0]);

            // Refresh function
            var refresh = function() {
                var clusterBy = function(d) {
                    return d[$scope.activeSwitch];
                };
                var nodes = computeNodes($scope.data, clusterBy);

                var clusterCenters = getClusterCenter(nodes, clusterBy, width, height);
                _.each(nodes, function(d) {
                    d.x = clusterCenters[d.cluster].x;
                    d.y = clusterCenters[d.cluster].y;
                });


                var bubbles = svg.selectAll('circle.bubble')
                                 .data(nodes, d3.f('id'));
                // Create bubbles
                bubbles.enter().append('circle')
                               .attr('class', 'bubble')
                               .attr('r', d3.f('r'))
                               .attr('fill', d3.f('fill'))
                               .attr('stroke', function(d) {
                                    return d3.rgb(d.fill).darker(1.5);
                               })
                               .attr('id', d3.f('name'))
                               .on('mouseenter', function() {
                                    d3.select(this).classed('hover', true);
                               })
                               .on('mouseleave', function() {
                                    d3.select(this).classed('hover', false);
                               });

                force.nodes(nodes).size([width, height]);
                // Enable and start the force layout
                force.gravity(-0.01).charge(charge).friction(0.9).on('tick', function(e) {
                    bubbles.each(function(d) {
                        d.x = d.x + (clusterCenters[d.cluster].x - d.x) * e.alpha * (0.3);
                        d.y = d.y + (clusterCenters[d.cluster].y - d.y) * e.alpha * (0.3);
                    }).attr('cx', d3.f('x'))
                      .attr('cy', d3.f('y'));
                });
                force.start();
            };

            $scope.$watch(function() { return $scope.data.length; }, function() {
                if ($scope.data.length > 0) {
                    refresh();
                }
            }, true);
        }
    };
}]);