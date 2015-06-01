'use strict';

var app = angular.module('app', ['lheader']);

// Filter which convert whatever string in an hexadecimal color code
app.filter('color', function() {
    return function(str) {
        str = (str || '').toUpperCase();

        var i, hash;
        i = hash = 0;
        while (i < str.length) {
            hash = str.charCodeAt(i++) + ((hash << 5) - hash);
        }

        var colour = '#';
        for (i = 0; i < 3; ++i) {
            var part = (hash >> i * 8) & 0xFF;
            part = Math.max(Math.min(part, 300), 100);
            colour += ('00' + part.toString(16)).slice(-2);
        }
        return colour;
    };
});

app.controller('Ctrl', ['$scope', '$http', '$filter', '$timeout', '$sce',
                        '$rootScope', function($scope, $http, $filter, $timeout, $sce, $rootScope) {
    var colors = [
        '#DF5A49', '#E27A3F', '#EFC94C', '#45B29D',
        '#334D5C', '#DFF2EF', '#4E7DA6', '#C42121',
        '#9E1D1D', '#6E1212', '#FF9D9D', '#FEE758',
        '#FFAD38', '#2C3E50', '#3E5101', '#839412',
        '#BDC032', '#D9A404', '#D96704'
    ];

    var allData;
    $scope.data = [];
    $scope.steps = [];
    $scope.currentStep = 0;

    $scope.legend = 'La taille des bulles correspond à l’audience : plus elles sont grosse, plus le titre est important. C’est une sélection des principaux titres des groupes de presse répartis en fonction des actionnaires majoritaires.';

    $scope.switches = [
        { label : 'En 2008' , value : '2008' },
        { label : 'En 2015' , value : '2015' }
    ];

    $scope.isFirstStep = function() {
        return $scope.currentStep === 0;
    };

    $scope.isLastStep = function() {
        return $scope.currentStep === $scope.steps.length - 1;
    };

    $scope.goToStep = (function() {
        var timeout;
        return function(index) {
            if (index >= 0 && $scope.steps[index] != null) {
                $timeout.cancel(timeout);

                $scope.currentStep = index;

                $rootScope.$broadcast('bubbles:switchTo', '2008');
                if ($scope.isFirstStep()) {
                    $scope.data = _.clone(allData);
                } else {
                    $scope.data = _.filter(allData, function(d) {
                        return d.step === $scope.currentStep;
                    });
                    timeout = $timeout(function() {
                        $rootScope.$broadcast('bubbles:switchTo', '2015');
                    }, 1500);
                }
            }
        };
    })();

    $scope.goToPrevStep = function() {
        $scope.goToStep($scope.currentStep - 1);
    };

    $scope.goToNextStep = function() {
        $scope.goToStep($scope.currentStep + 1);
    };

    $http.get('data/steps.tsv').then(function(response) {
        $scope.steps = d3.tsv.parse(response.data, function(d) {
            d.text = $sce.trustAsHtml(d.text);
            return d;
        });

        $http.get('data/data.csv').then(function(response) {
            allData = _(d3.csv.parse(response.data, function(d, i) {
                var out = {
                    id : i,
                    name : d.Titre.trim(),
                    type : d.Type.trim(),
                    r : +(d['Hiérarchie'] || 1),
                    step : parseInt(d.Etape),
                };
                out[d['Année']] = d.Groupe.trim();
                return out;
            })).groupBy('name').map(function(d) {
                return _.merge(d[0], d[1], function(a, b, k) {
                    if (k === 'step') {
                        return (a === b) ? a : (_.isUndefined(a) || isNaN(a)) ? b : a;
                    }
                    return (a === b) ? a : _.isUndefined(a) ? b : a;
                });
            }).value();

            var groups = _(allData).pluck('2008').reject(_.isUndefined).uniq().value();

            _.each(allData, function(d) {
                d.fill = colors[groups.indexOf(d['2008'])];//$filter('color')(d['2008']);
            });

            $scope.goToStep(0);
        });
    });

}]);