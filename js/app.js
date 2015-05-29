'use strict';

var app = angular.module('app', ['lheader']);

// Filter which convert whatever string in an hexadecimal color code
app.filter('color', function() {
    return function(str) {
        str = (str || '').toUpperCase();

        var i, hash;
        i = hash = 0;
        while (i < str.length) {
            hash = str.charCodeAt(i++) + ((hash << 3) - hash);
        }

        var colour = '#';
        for (i = 0; i < 3; ++i) {
            var part = (hash >> i * 8) & 0xFF;
            part = Math.max(Math.min(part, 200), 100);
            colour += ('00' + part.toString(16)).slice(-2);
        }
        return colour;
    };
});

app.controller('Ctrl', ['$scope', '$http', '$filter', function($scope, $http, $filter) {
    $scope.data = [];

    $scope.steps = [
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

    var goToStep = function(index) {
        if (index >= 0 && $scope.steps[index] != null) {
            $scope.currentStep = index;
        }
    };

    $scope.goToPrevStep = function() {
        goToStep($scope.currentStep - 1);
    };

    $scope.goToNextStep = function() {
        goToStep($scope.currentStep + 1);
    };

    $http.get('data/data.csv').then(function(response) {
        var data = {};

        /* jslint newcap: true */
        var csvArray = CSVToArray(response.data);
        var csvHeader = _.invert(_.first(csvArray.splice(0, 1)));

        for (var i = 0; i < csvArray.length; ++i) {
            var title = csvArray[i][csvHeader.Titre].trim();
            var year = csvArray[i][csvHeader['Année']].trim();
            var group = csvArray[i][csvHeader.Groupe].trim();
            var type = csvArray[i][csvHeader.Type].trim();
            var hierarchie = parseInt(csvArray[i][csvHeader['Hiérarchie']]);
            if (data[title] == null) {
                data[title] = {
                    id : i,
                    name : title,
                    type : type,
                    r : hierarchie,
                };
            }
            data[title][year] = group;
        }
        _.each(data, function(d) {
            d.fill = $filter('color')(d['2008']);
        });

        $scope.data = _.values(data);
    });
}]);