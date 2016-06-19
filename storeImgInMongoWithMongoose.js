/**
 * Module dependencies
 */

var express = require('express')
    , http = require('http');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var request = require('request');

// connect to mongo
mongoose.connect('localhost', 'testing_storeImg');

// example schema
var schema = new Schema({
    img: {data: Buffer, contentType: String}
});

// our model
var A = mongoose.model('A', schema);

mongoose.connection.on('open', function () {
    console.error('mongo is open');

    // empty the collection
    A.remove(function (err) {
        if (err) throw err;

        console.error('removed old docs');

        request({
            url: 'https://s-media-cache-ak0.pinimg.com/736x/8a/18/09/8a1809830f041ce759fba955946b4d09.jpg',
            encoding: 'binary'
        }, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                body = new Buffer(body, 'binary');

                // Here "body" can be affected to the "a.img.data"
                var a = new A;
                a.img.data = body;
                // ....
            }
            // store an img in binary in mongo
            // var a = new A;
            // a.img.data = fs.readFileSync(imgPath);
            // a.img.data = body;
            a.img.contentType = 'image/png';
            a.save(function (err, a) {
                if (err) throw err;

                console.error('saved img to mongo');

                // start a demo server
                // var server = express.createServer();
                var app = express();
                var server = http.createServer(app);

                app.get('/', function (req, res, next) {
                    A.findById(a, function (err, doc) {
                        if (err) return next(err);
                        res.contentType(doc.img.contentType);
                        res.send(doc.img.data);
                    });
                });

                server.on('close', function () {
                    console.error('dropping db');
                    mongoose.connection.db.dropDatabase(function () {
                        console.error('closing db connection');
                        mongoose.connection.close();
                    });
                });

                server.listen(8000, function (err) {
                    var address = server.address();
                    console.error('server listening on http://%s:%d', address.address, address.port);
                    console.error('press CTRL+C to exit');
                });

                process.on('SIGINT', function () {
                    server.close();
                });
            });
        });
    });
});
