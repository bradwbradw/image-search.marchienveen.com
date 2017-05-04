"use strict";
const express = require('express'),
  _ = require('lodash'),
  when = require('when');

const port = process.env.PORT || 8081;
const db = require('./mongo'),
  flickr = require('./flickr');

const app = express();

app.use(express.static('client'));

console.log(`listening at ${port} `);

app.get('/search/:q', (req, res) => {
  let query;
  try {
    query = JSON.parse(req.params.q)
  } catch (err) {
    res.status(500).json({message: `could not parse JSON. got ${req.params.q}`, error: err});
  }
  if (query) {
    db.get(query)
      .then(result => {
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

app.get('/load-flickr', (req, res) => {

  let count;

  db.count()
    .then(c => {
      count = c;
      return flickr.getRecent(2);
    })
    .then(results => {
      return when.all(_.map(results, db.upsert))
    })
    .then(db.count)
    .then(newTotal => {
      let info = {newTotal, justAdded:(newTotal - count)};
      console.log(info);
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

app.listen(port);
