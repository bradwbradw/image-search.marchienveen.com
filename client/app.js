'use strict';

angular.module('images', [
  '720kb.datepicker']);

angular.module('images')
  .controller('MainController',
    function ($http, $log, $q, $timeout) {

      var MainController = this;


      MainController.now = function () {
        return new Date();
      };

      var flickr = {
        key: '1bae316db388283e09cfd3bc537484ab',
        secret: '16721ac62e8d6a31'
      };

      var setResults = function (list) {
        console.log('set list to', list);
        MainController.results = list;
      };

      var fields = [
        'date_upload',
        'date_taken',
        'license',
        'url_sq',
        'url_o'
      ];
      var flickrSearch = function (date, plusOrMinus) {
          var dateFormat = 'YYYY-MM-DD HH:mm:SS';
          var min = moment(date).subtract(plusOrMinus, 'seconds').format(dateFormat);
          var max = moment(date).add(plusOrMinus, 'seconds').format(dateFormat);// + 8000;

          $http.get('/search', {
            params: {
              q: {
                $and: [
                  {
                    datetaken: {
                      $gte: min
                    }
                  },
                  {
                    datetaken: {
                      $lte: max
                    }
                  }
                ]
              }
            }
          })
            .then(function (results) {
              return _.get(results, 'data.photos');
            })
            .then(setResults)
            .catch(function (error) {
              $log.error(error);
            });
        }
        ;

      MainController.render = function (obj) {
        var rendered = {};
        _.each(fields.concat([]), function (name) {
          rendered[name] = obj[name];
        });

        return rendered;

      };

      MainController.setResults = setResults;
      MainController.flickrSearch = flickrSearch;

    });


angular.module('images')
  .directive('showIfLoading', ['$http', function ($http) {
    return {
      restrict: 'A',
      link: function (scope, element, attrs) {
        scope.isLoading = function () {
          return $http.pendingRequests.length > 0;
        };
        scope.$watch(scope.isLoading, function (value) {
          if (value) {
            element.removeClass('ng-hide');
          } else {
            element.addClass('ng-hide');
          }
        });
      }
    };
  }]);