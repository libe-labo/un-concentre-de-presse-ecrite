'use strict';

angular.module('app').directive('bubbles', [function() {
    // Utility function which convert whatever string in an hexadecimal color code
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

    var computeNodes = function(data, clusterBy, oldNodes) {
        var nodes;

        nodes = _(data).map(function(d) {
            if (clusterBy(d) != null) {
                return {
                    id : d.id,
                    name : d.name,
                    r : 12,
                    x : 0,
                    y : 0,
                    fill : colorFromString(clusterBy(d)),
                    cluster : clusterBy(d)
                };
            }
            return undefined;
        }).reject(_.isUndefined).value();

        if (oldNodes != null && oldNodes.length > 0) {
            oldNodes = _.indexBy(oldNodes, 'name');
            _.each(nodes, function(node) {
                if (oldNodes[node.name] != null) {
                    node.x = oldNodes[node.name].x;
                    node.y = oldNodes[node.name].y;
                }
            });
        }

        return nodes;
    };

    var getClusterCenter = function(data, clusterBy, width, height) {
        var clusters = _(data).map(d3.f('cluster')).groupBy().map(function(d, k) {
            var item = {
                name : k,
                value : d.length
            };

            return item;
        }).value();

        var map = d3.layout.pack().size([width, height]).sort(function(a, b) {
            return d3.descending(a.value, b.value);
        });
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
                top : 0,
                right : 50,
                bottom : 0,
                left : 50
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

            var clusterCenters, nodes;
            var clusterBy = function(d) {
                return d[$scope.activeSwitch];
            };

            // Refresh function
            var refresh = function() {
                nodes = computeNodes($scope.data, clusterBy, nodes);
                clusterCenters = getClusterCenter(nodes, clusterBy, width, height);

                var bubbles = svg.selectAll('circle.bubble')
                                 .data(nodes, d3.f('id'));

                // Create new bubbles
                bubbles.enter().append('circle')
                               .attr('class', 'bubble')
                               .attr('r', d3.f('r'))
                               .attr('id', d3.f('name'))
                               .attr('x', 0)
                               .attr('y', 0)
                               .on('mouseenter', function() {
                                    d3.select(this).classed('hover', true);
                               })
                               .on('mouseleave', function() {
                                    d3.select(this).classed('hover', false);
                               }).call(force.drag);

                // Remove old bubbles
                bubbles.exit().remove();

                // Update existing bubbles
                bubbles.attr('fill', d3.f('fill'))
                       .attr('opacity', function(d) { return d.fadedOut ? 0.2 : 1; })
                       .attr('stroke', function(d) {
                            return d3.rgb(d.fill).darker(1.5);
                       }).each(function(d) {
                            // We're using Tipsy to show tooltips on mouseover
                            $(this).attr('original-title', d.name + ' - ' + d.cluster);
                            $(this).tipsy({
                                gravity : $.fn.tipsy.autoNS,
                                title : function() { return $(this).attr('original-title'); }
                            });
                       });

                force.nodes(nodes).size([width, height]);
                // Enable and start the force layout
                force.gravity(-0.01).charge(charge).friction(0.9).on('tick', function(e) {
                    bubbles.each(function(d) {
                        var clusterCenter = clusterCenters[d.cluster] || { x : 0 , y : 0 };
                        d.x = d.x + (clusterCenter.x - d.x) * e.alpha * (0.3);
                        d.y = d.y + (clusterCenter.y - d.y) * e.alpha * (0.3);
                    }).attr('cx', d3.f('x'))
                      .attr('cy', d3.f('y'));
                });
                force.start();
            };

            // Switches
            $scope.switches = [
                '2008',
                '2015'
            ];

            $scope.activateSwitch = function(theSwitch) {
                if ($scope.switches.indexOf(theSwitch) >= 0) {
                    $scope.activeSwitch = theSwitch;
                    refresh();
                }
            };

            $scope.activateSwitch($scope.switches[0]);

            $scope.$watch(function() { return $scope.data.length; }, function() {
                if ($scope.data.length > 0) {
                    refresh();
                }
            }, true);
        }
    };
}]);