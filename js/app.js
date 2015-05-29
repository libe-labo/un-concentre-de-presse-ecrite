'use strict';

var app = angular.module('app', ['lheader']);

app.controller('Ctrl', ['$scope', '$http', function($scope, $http) {
    $scope.data = [];

    $scope.steps = [
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' },
        { title : 'Lorem Ipsum' , text : 'Lorem ipsum Dolor proident incididunt magna mollit in consectetur culpa magna ut cillum qui cillum id deserunt consectetur ut pariatur sunt laborum dolor occaecat ad consectetur sit.' }
    ];
    $scope.currentStep = 0;

    $scope.switches = ['2008', '2015'];

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
                    r : hierarchie
                };
            }
            data[title][year] = group;
        }

        $scope.data = _.values(data);
    });
}]);