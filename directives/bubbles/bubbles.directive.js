'use strict';

angular.module('app').directive('bubbles', ['$filter', '$rootScope', function($filter, $rootScope) {
    var colorFromString = function(str) {
    };

    var computeNodes = function(data, clusterBy, oldNodes) {
        var nodes;

        nodes = _(data).map(function(d) {
            if (clusterBy(d) != null) {
                return {
                    id : d.id,
                    name : d.name,
                    r : (d.r || 1) * 10,
                    x : 0,
                    y : 0,
                    fill : d.fill || $filter('color')(d.name),
                    cluster : clusterBy(d),
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
        var clusters = _(data).map(ƒ('cluster')).groupBy().map(function(d, k) {
            var item = {
                name : k,
                value : d.length
            };

            return item;
        }).value();

        var map = d3.layout.pack().size([width, height]).sort(function(a, b) {
            return d3.ascending(a.value, b.value);
        }).padding(100);
        map.nodes({ children : clusters });
        clusters = _.indexBy(clusters, 'name');

        return clusters;
    };

    return {
        restrict : 'EA',
        scope : {
            data : '=',
            switches : '=',
            labels : '=',
            legend : '='
        },
        templateUrl : 'directives/bubbles/bubbles.html',
        link : function($scope, element) {
            var svg = angular.element(element).find('div.d3');

            var padding = {
                top : 0,
                right : 0,
                bottom : 0,
                left : 0
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
                                 .data(nodes, ƒ('id'));

                // Create new bubbles
                bubbles.enter().append('circle.bubble')
                       .attr('r', ƒ('r'))
                       .attr('id', ƒ('name'))
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
                bubbles.attr('fill', ƒ('fill'))
                       .attr('stroke', function(d) {
                            return d3.rgb(d.fill).darker(0.5);
                       }).each(function(d) {
                            // We're using Tipsy to show tooltips on mouseover
                            $(this).attr('original-title', d.name);
                            $(this).tipsy({
                                gravity : $.fn.tipsy.autoNS,
                                title : function() { return $(this).attr('original-title'); }
                            });
                       });

                // Enable and start the force layout
                force.nodes(nodes).size([width, height]);
                force.gravity(0.1).charge(charge).friction(0.7).on('tick', function(e) {
                    bubbles.each(function(d) {
                        // Get attracted by the cluster's center
                        var clusterCenter = clusterCenters[d.cluster] || { x : 0 , y : 0 };
                        d.x += (clusterCenter.x - d.x) * (e.alpha * 0.18);
                        d.y += (clusterCenter.y - d.y) * (e.alpha * 0.18);
                        // Make sure everything is still inside the viewport
                        d.x = Math.max(d.r * 2, Math.min(d.x, width - d.r * 2));
                        d.y = Math.max(d.r * 2, Math.min(d.y, height - d.r * 2));
                    }).attr('cx', ƒ('x'))
                      .attr('cy', ƒ('y'));
                });
                force.start();

                svg.selectAll('.label').remove();
                if ($scope.labels) {
                    svg.selectAll('.label')
                       .data(_.values(clusterCenters)).enter()
                       .append('text.label')
                       .text(ƒ('name'))
                       .translate(function(d) { return [d.x - (d.name.length * 2), d.y]; });
                }
            };

            // Switches
            $scope.theSwitches = [ ];

            $scope.activateSwitch = function(theSwitch) {
                for (var i = 0; i < $scope.theSwitches.length; ++i) {
                    if ($scope.theSwitches[i].value === theSwitch) {
                        $scope.activeSwitch = theSwitch;
                        refresh();
                        break;
                    }
                }
            };

            $scope.$watch(function() { return $scope.data; }, function() {
                if ($scope.data.length > 0) {
                    refresh();
                }
            }, true);

            $scope.$watch(function() { return $scope.switches; }, function() {
                $scope.theSwitches = [];
                for (var i = 0; i < $scope.switches.length; ++i) {
                    if ($scope.switches[i] instanceof Object) {
                        $scope.theSwitches.push($scope.switches[i]);
                    } else {
                        $scope.theSwitches.push({ label : $scope.switches[i] , value : $scope.switches[i] });
                    }
                }
                $scope.activateSwitch($scope.theSwitches[0].value);
            }, true);

            $rootScope.$on('bubbles:switchTo', function(event, param) {
                $scope.activateSwitch(param);
            });

            $(window).on('resize', _.debounce(function() {
                var e = angular.element(element).find('div.d3');
                width = e.width();
                height = e.height();

                d3.select(e.get(0)).select('svg')
                  .attr('width', width)
                  .attr('height', height);

                width = width - padding.left - padding.right;
                height = height - padding.top - padding.bottom;
                svg.attr('width', width)
                   .attr('height', height);

                refresh();
            }));
        }
    };
}]);