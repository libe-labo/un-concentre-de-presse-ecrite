'use strict';

angular.module('app').directive('bubbles', [function() {
    var computeNodes = function(data) {
        var nodes = _.map(data, function(d) {
            return {
                id : d,
                r : 10,
                x : 0,
                y : 0,
                cluster : Math.round(Math.random())
            };
        });

        return nodes;
    };

    var getClusterCenter = function(data, clusterBy, width, height) {
        return [
            { x : width / 3, y : height / 2 },
            { x : (width / 3) * 2, y : height / 2 },
        ];
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


            $scope.data = _.range(30);
            var nodes = computeNodes($scope.data);

            var clusterCenters = getClusterCenter(nodes, '', width, height);
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
                           .on('mouseenter', function() {
                                d3.select(this).classed('hover', true);
                           })
                           .on('mouseleave', function() {
                                d3.select(this).classed('hover', false);
                           });


            var force = d3.layout.force().nodes(nodes).size([width, height]);
            var charge = function(d) {
                return -Math.pow(d.r, 2.0) / 3;
            };
            // Enable and start the force layout
            force.gravity(-0.01).charge(charge).friction(0.9).on('tick', function(e) {
                bubbles.each(function(d) {
                    d.x = d.x + (clusterCenters[d.cluster].x - d.x) * e.alpha * (0.3);
                    d.y = d.y + (clusterCenters[d.cluster].y - d.y) * e.alpha * (0.3);
                }).attr('cx', d3.f('x'))
                  .attr('cy', d3.f('y'));
            });
            force.start();

            // Switches
            $scope.switches = [
                2008,
                2015
            ];

            $scope.activateSwitch = function(theSwitch) {
                if ($scope.switches.indexOf(theSwitch) >= 0) {
                    $scope.activeSwitch = theSwitch;
                }
            };

            $scope.activateSwitch($scope.switches[0]);
        }
    };
}]);