'use strict';

var app = angular.module('app', ['lheader']);

app.controller('Ctrl', ['$scope', '$http', function($scope, $http) {
    $scope.data = [];

    $http.get('data/data.csv').then(function(response) {
        var data = {};

        var csvArray = CSVToArray(response.data);
        var csvHeader = _.invert(_.first(csvArray.splice(0, 1)));

        for (var i = 0; i < csvArray.length; ++i) {
            var title = csvArray[i][csvHeader.Titre].trim();
            var year = csvArray[i][csvHeader['Année']].trim();
            var group = csvArray[i][csvHeader.Groupe].trim();
            var type = csvArray[i][csvHeader.Type].trim();
            if (data[title] == null) {
                data[title] = {
                    id : i,
                    name : title,
                    type : type
                };
            }
            data[title][year] = group;
        }

        $scope.data = _.values(data);
    });
}]);