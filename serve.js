"use strict";
const express = require('express'),
  _ = require('lodash'),
  when = require('when');

const port = process.env.PORT || 8081;
const MAX_IMAGES = process.env.MAX_IMAGES || 1000000;
const LOAD_INTERVAL = process.env.LOAD_INTERVAL || 5 * 60 * 1000;

const db = require('./mongo'),
  flickr = require('./flickr');

const app = express();

app.use(express.static('client'));

console.log(`listening at ${port} `);

app.get('/search', (req, res) => {
  let query;
  try {
    query = JSON.parse(req.query.q)
  } catch (err) {
    res.status(500).json({message: `could not parse JSON. got ${req.params.q}`, error: err});
  }
  if (query) {
    db.get(query)
      .then(result => {

        console.log(`/load-flickr ${JSON.stringify(query)}`);
        res.json({
          count: _.size(result),
          q: query,
          photos: _.reverse(_.sortBy(result, 'datetaken'))
        });
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({message: 'error fetching', error: err});
      });
  } else {
    res.status(500).json({message: 'no query found', query});
  }
});

function removeOldest(n){
  if(!_.isNumber(n)){
    n = 0;
  } else {
    console.log(`removing ${n} documents`);
  }

  let removals = when.resolve();
  while(n > 0){
    removals = removals.then(db.remove());
    n--;
  }

}

function loadFlickr() {
  let count;

  return db.count()
    .then(c => {
      count = c;
      return flickr.getRecent();
    })
    .then(results => {
      return when.all(_.map(results, db.upsert))
    })
    .then(db.count)
    .then(newTotal => {
      let info = {newTotal, justAdded: (newTotal - count)};
      console.log(info);

      if (count >= MAX_IMAGES) {
        removeOldest(count - MAX_IMAGES);
      }
      return info
    })
}

loadFlickr();
setInterval(loadFlickr, LOAD_INTERVAL);

app.get('/load-flickr', (req, res) => {

  loadFlickr()
    .then(info => {
      res.json(info);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: err});
    });
});

app.get('/all', (req, res) => {
  db.get({})
    .then(result => {
      res.json({
        count: _.size(result),
        photos: _.reverse(_.sortBy(result, 'datetaken'))
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'error fetching', error: err});
    });
});

app.use((req, res, next) => {
  console.log(req.url);
  next();
});
app.listen(port);
