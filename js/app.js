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

app.controller('Ctrl', ['$scope', '$http', '$filter', '$timeout',
                        '$rootScope', function($scope, $http, $filter, $timeout, $rootScope) {
    var allData;
    $scope.data = [];

    $scope.steps = [
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' }
    ];
    $scope.currentStep = 0;

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

    $http.get('data/data.csv').then(function(response) {
        allData = _(d3.csv.parse(response.data, function(d, i) {
            var out = {
                id : i,
                name : d.Titre.trim(),
                type : d.Type.trim(),
                r : +(d['Hiérarchie'] || 1),
                step : +d.Etape,
            };
            out[d['Année']] = d.Groupe.trim();
            return out;
        })).groupBy('name').map(function(d) {
            return _.merge(d[0], d[1], function(a, b, k) {
                if (k === 'r') {
                    return a > b ? a : b;
                }
                return (a === b) ? a : (a == null) ? b : a;
            });
        }).each(function(d) { d.fill = $filter('color')(d['2008']); }).value();

        $scope.goToStep(0);
    });
}]);