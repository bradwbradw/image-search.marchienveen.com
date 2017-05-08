const MongoClient = require('mongodb').MongoClient,
  _ = require('lodash'),
  mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost/images',
  when = require('when');

/*

let mongoConnectionPromise;
let collectionPromise;
function mongo() {
  if (mongoConnectionPromise) {
    return mongoConnectionPromise
  }
  if (mongoConnection) {
    p = when.resolve(mongoConnection);
  } else {
    p = MongoClient.connect(mongoUrl);
  }
  return p.then(db => {
    mongoConnection = db;
    return mongoConnection.collection('flickr-recent');
  });

}*/
let collection;
let collectionPromise;

function mongo() {
  if (!collection && !collectionPromise) {
    collectionPromise = MongoClient.connect(mongoUrl)
      .then(mongoConnection => {
        collection = mongoConnection.collection('flickr-recent');
        return collection;
      });
    return collectionPromise;
  } else if(collectionPromise){
     return collectionPromise
  } else {
    return when.resolve(collection);
  }
}

const upsert = record => {
  if(record.id){
    record._id = record.id;
    record = _.omit(record, 'id');
  }
  return mongo()
    .then(collection => {
      return collection.insertOne(record)
        .catch(() => {
          return collection.findOneAndUpdate({_id: record._id}, record);
        })
    })
    .catch(err => {
      console.error('error connecting to mongo', err);

    })
};

const get = query => {
  return mongo()
    .then(collection => {
      return collection.find(query)
        .toArray()
    })
};

const getById = id => {
  return mongo()
    .then(collection => {
      return collection.findOne({_id: id})
    });
};

const count = () => {

  return mongo()
    .then(collection => {
      return collection.count()
    })

};

const remove = () => {
  return mongo()
    .then(collection => {
      return collection.findOneAndDelete({}, {
        sort:{datetaken:1}
      })
    })
};

module.exports = {
  upsert,
  get,
  getById,
  remove,
  count
};