'use strict'

var COLLECTION = 'test.asdf';

var express = require('express.io');
var app = express();
var path = require('path');
var mongodb = require('mongodb');

app.use(express.static(path.join(__dirname, 'public')));
app.http().io();

mongodb.MongoClient.connect('mongodb://localhost:12345/local', function(err, db) {
    db.collection('oplog.rs', function(err, oplog) {
        var filter = {ns: COLLECTION, op: 'i'};

        oplog.find(filter, {ts: 1}).sort({$natural: -1}).limit(1)
            .toArray(function(err, data) {
                var lastOplogTime = data[0].ts;

                // set MongoDB cursor options
                var cursorOptions = {
                    tailable: true,
                    awaitdata: true,
                    numberOfRetries: 9007199254740992
                };

                if (lastOplogTime) {
                    filter.ts = {'$gt': lastOplogTime};
                }
            
                oplog.find(filter, cursorOptions).stream()
                    .on('data', function(doc) {
                        app.io.broadcast('new image', doc.o);
                    });
            });
    });
});

mongodb.MongoClient.connect('mongodb://localhost:12345/test', function(err, db) {
    db.collection('asdf', function(err, asdf) {
        // start with empty collection
        asdf.remove({}, null, function(err, res) {
            app.get('/img', function(req, res) {
                var query = {_id: mongodb.ObjectId(req.query.id)};
                asdf.find(query, {fields: {img: 1}}).toArray(function(err, data) {
                    var img = data[0].img;
                    res.header('Content-Type', 'image/png');
                    res.end(img.read(0, img.length()), 'binary');
                });
            });

            app.get('/search', function(req, res) {
                var from = parseInt(req.query.s);
                var thru = parseInt(req.query.e);
                var query = {
                    $text: {$search: req.query.q},
                    _id: {
                        $gte: mongodb.ObjectID.createFromTime(from / 1000),
                        $lte: mongodb.ObjectID.createFromTime(thru / 1000)
                    }
                };

                asdf.find(query, {fields: {_id: 1}}).toArray(function(err, data) {
                    res.header('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        thru: thru,
                        results: data.map(function(d) {
                            return d._id;
                        })
                    }));
                });
            });
        });
    });
});

app.get('/', function(req, res) {
    req.io.route('index.html');
});

app.listen(7076);
