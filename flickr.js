"use strict";

const request = require('request-promise'),
  when = require('when'),
  _ = require('lodash');

const key = process.env.FLICKR_API_KEY || '1bae316db388283e09cfd3bc537484ab';
const flickrUrl = process.env.FLICKR_API_URL || 'https://api.flickr.com/services/rest';

const perPage = 500;

const fields = [
  'date_upload',
  'date_taken',
  'owner_name',
  'url_sq',
  'url_l',
  'url_o'
];

const pickFields = 'title ownername url_sq url_o url_l datetaken dateupload id'.split(' ');

module.exports = {
  getRecent: numPages => {

    if (!numPages) {
      numPages = 1;
    }

    var params = {
      api_key: key,
      method: 'flickr.photos.getRecent',
      format: 'json',
//          text: q || 'sunset',
      extras: fields.join(','),
      per_page: perPage,
      //tags:'tag',
      //&nojsoncallback=
      nojsoncallback: 1,
      min_upload_date: '',
      max_upload_date: ''
    };

    function getPage(page) {

      var options = {
        uri: flickrUrl,
        qs: params,
        json: true // Automatically parses the JSON string in the response
      };
      options.qs.page = page;

      return request(options)
        .then(res => {
          return _.get(res, 'photos.photo');
        })
    }

    let requests = [];
    let count = 1;

    while (count <= numPages) {
      requests.push(getPage(count));
      count++;
    }

    function clean(results) {
      return _.map(_.flatten(results), result => {
//        console.log('cleaning', result);
        let clean = _.pick(result, pickFields);
        _.extend(clean, {
          url: clean.url_o ? clean.url_o : _.get(clean, 'url_l', 'url not found'),
          thumb: clean.url_sq
        });
        _.each(['url_o', 'url_l', 'url_sq'], prop => {
          _.unset(clean, prop);
        });

        return clean
      });
    }

    return when.all(requests)
      .then(clean)
      .catch(err => {
        console.error(err);
        return when.reject(err);
      })
  }
};
