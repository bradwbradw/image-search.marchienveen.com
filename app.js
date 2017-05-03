'use strict';

angular.module('images', []);

angular.module('images')
  .controller('MainController',
    function ($http, $log, $q) {

      var MainController = this;
      var results;

      var flickr = {
        key: '1bae316db388283e09cfd3bc537484ab',
        secret: '16721ac62e8d6a31'
      };

      var setResults = function (list) {
        list = _.flatten(list);
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
      var flickrSearch = function (numPages) {
        if (!numPages) {
          numPages = 1;
        }

        var url = 'https://api.flickr.com/services/rest';
        var params = {
          api_key: flickr.key,
          method: 'flickr.photos.getRecent',
          format: 'json',
//          text: q || 'sunset',
          extras: fields.join(','),
          per_page: 10,
          //tags:'tag',
          //&nojsoncallback=
          nojsoncallback: 1,
          min_upload_date: '',
          max_upload_date: ''
        };

        var page = 1;
        var requests = [];

        while (page <= numPages) {
          console.log('loading page '+page);
          var theParams = _.extend(_.clone(params), {page: page});
          console.log(theParams);
          requests.push(
            $http.get(url, {
              params: theParams
            })
              .then(function (result) {
                console.log(result.data);
                return result.data.photos.photo
              })
          );
          page = page + 1;
        }
        return $q.all(requests)
          .then(setResults)
          .catch(function (error) {
            $log.error(error);
          });
      };


      var googleSearch = function (q) {
        var key = 'AIzaSyDDQ9IirI7awAqEd8Cs1uZXOjCsrvvXzGc';
        var cx = '000470345141694594996:sdx6p7dlw3o';

        var url = 'https://www.googleapis.com/customsearch/v1';
        return $http.get(url, {
          params: {
            key: key,
            q: q || 'sunset',
            cx: cx,
            searchType: 'image',
            dateRestrict: 'd8',
            imgType: 'photo',
            siteSearchFilter: 'i'
          }
        })
          .then(function (result) {
            return result.data.items
          })
          .then(setResults)
          .catch(function (error) {
            $log.error(error);
          });
      };

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