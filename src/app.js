// vt-server/src/app.js

// A MongoDB REST Web service.

'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const ingest = require('./ingest');

const app = express();

app.use(bodyParser.json());

app.use(cors());
//app.disable('etag');	// Prevent HTTP 304 Not Modified. See https://stackoverflow.com/questions/18811286/nodejs-express-cache-and-304-status-code

const router = express.Router();				// eslint-disable-line new-cap

const config = require('../config/config');

const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

const url = config.databaseUrl;
const dbName = config.databaseName;
const collectionName = config.collectionName;


router.post('/ingest', function (req, res) {
	ingest()
		.then(_ => {
			const message = 'POST /u/ingest : Completed.';

			console.log(message);
			res.status(200).send(message);
		})
		.catch(error => {
			const errorMessage = `POST /u/ingest : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// 1) Create (the C in CRUD)

// See e.g. https://stackoverflow.com/questions/7172784/how-to-post-json-data-with-curl-from-terminal-commandline-to-test-spring-rest :

// **** BEGIN stackoverflow.com excerpt ****

// You need to set your content-type to application/json. But -d sends the Content-Type application/x-www-form-urlencoded, which is not accepted on Spring's side.

// Looking at the curl man page, I think you can use -H:

// -H "Content-Type: application/json"

// Full example:

// curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3000/api/login

// (-H is short for --header, -d for --data)

// Note that -X POST is optional if you use -d, as the -d flag implies a POST request.

// **** END stackoverflow.com excerpt ****

// https://stackoverflow.com/questions/11625519/how-to-access-the-request-body-when-posting-using-node-js-and-express

// Test via: curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:3000/u/

// Test via: curl -H "Content-Type: application/json" -X POST -d '{"id":1,"name":"North Carolina State University at Raleigh","numUndergraduateStudents":22925,"percentWhite":74.67,"percentBlack":6.5,"percentHispanic":4.47,"percentAsian":5.37,"percentAmericanNative":0.42,"percentPacificIslander":0.06,"percentMultipleRaces":3.51,"percentNonResidentAlien":3.27,"percentUnknown":1.72,"shortName":"NCSU Raleigh"}' http://localhost:3000/u/

router.post('/', function (req, res) {
	let university = req.body;
	let client = null;

	console.log('Received request: POST /u/');

	MongoClient.connect(url)
		.then(_client => {
			console.log(`POST /u/ : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			return collection.insertOne(university);
		})
		.then(result => {
			// const message = 'POST /u/ : Completed.';

			console.log('POST /u/ : Completed.');
			// console.log('result:', result);
			// console.log('result.insertedId:', result.insertedId);
			client.close();
			// HTTP status code 201 means Created.
			// res.status(201).send(message);
			// res.status(201).send({ "insertedId": result.insertedId });

			// result.ops[0] should be the same as university.
			console.log('university before setting _id:', university);
			// university._id = result.insertedId;
			// console.log('university:', university);
			res.status(201).send(university);
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `POST /u/ : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// 2) Read (the R in CRUD)

// Test via curl -X "GET" http://localhost:3000/u/ or simply curl http://localhost:3000/u/

// ? To get the value of a URL parameter (e.g. ".../?name=foo"), refer to req.query.name (which should equal 'foo').
// See https://stackoverflow.com/questions/17007997/how-to-access-the-get-parameters-after-in-express

router.get('/', function (req, res) {
	let searchString = req.query.name;
	let client = null;

	console.log('Received request: GET /u/');

	MongoClient.connect(url)
		.then(_client => {
			console.log(`GET /u/ : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);

			return collection.find().toArray();
		})
		.then(universities => {
			
			if (searchString) {
				searchString = searchString.toLowerCase();
				universities = universities.filter(university => university.name.toLowerCase().indexOf(searchString) >= 0);
			}

			console.log(`GET /u/ : Returning result: ${universities}`);
			client.close();
			res.json(universities);
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `GET /u/ : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// Test via curl -X "GET" http://localhost:3000/u/1 or simply curl http://localhost:3000/u/1

router.get('/:id', function (req, res) {
	const id = parseInt(req.params.id);
	let client = null;

	console.log(`Received request: GET /u/${id}`);

	MongoClient.connect(url)
		.then(_client => {
			console.log(`GET /u/${id} : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);
			const query = { id: id };

			return collection.findOne(query);
		})
		.then(university => {
			console.log(`GET /u/${id} : Returning result: ${university}`);

			client.close();

			if (university) {
				res.json(university);
			} else {
				const errorMessage = `GET /u/${id} : A university with ID ${id} was not found.`;

				console.error(errorMessage);
				res.status(404).send(errorMessage);
			}
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `GET /u/${id} : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// 3) Update (the U in CRUD)

// Test via: curl -H "Content-Type: application/json" -X PUT -d '{"id":1,"name":"Buckwheat University","numUndergraduateStudents":22925,"percentWhite":74.67,"percentBlack":6.5,"percentHispanic":4.47,"percentAsian":5.37,"percentAmericanNative":0.42,"percentPacificIslander":0.06,"percentMultipleRaces":3.51,"percentNonResidentAlien":3.27,"percentUnknown":1.72,"shortName":"NCSU Raleigh"}' http://localhost:3000/u/1

router.put('/:id', function (req, res) {
	const id = parseInt(req.params.id);
	const university = req.body;
	let client = null;

	console.log(`Received request: PUT /u/${id}`);

	MongoClient.connect(url)
		.then(_client => {
			console.log(`PUT /u/${id} : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);
			const filter = { id: id };

			// See @dyouberg at https://stackoverflow.com/questions/38883285/error-the-update-operation-document-must-contain-atomic-operators-when-running
			// See https://docs.mongodb.com/manual/reference/method/db.collection.replaceOne/
			return collection.replaceOne(filter, university);
		})
		.then(_ => {
			console.log(`PUT /u/${id} : Completed.`);
			client.close();
			res.status(200).send(`Successful PUT of University ${university} to /u/${id}`);
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `PUT /u/${id} : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// See https://docs.mongodb.com/manual/reference/method/db.collection.updateOne/
// See https://stackoverflow.com/questions/38883285/error-the-update-operation-document-must-contain-atomic-operators-when-running

// Just pass in the changed fields, not necessarily the entire object.

// Test via: curl -H "Content-Type: application/json" -X PATCH -d '{"name": "Bar University"}' http://localhost:3000/u/2

router.patch('/:id', function (req, res) {
	const id = parseInt(req.params.id);
	const changes = req.body;
	let client = null;

	console.log(`Received request: PATCH /u/${id}`);

	MongoClient.connect(url)
		.then(_client => {
			console.log(`PATCH /u/${id} : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);
			const filter = { id: id };
			const update = { $set: changes };
			const upsert = false;	// See https://stackoverflow.com/questions/19974216/is-there-an-upsert-option-in-the-mongodb-insert-command
			const options = { upsert: upsert };

			return collection.updateOne(filter, update, options);
		})
		.then(_ => {
			const message = `PATCH /u/${id} : Completed.`;

			console.log(message);
			client.close();
			res.status(200).send(message);
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `PATCH /u/${id} : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

// 4) Delete (the D in CRUD)

// Test via: curl -X "DELETE" http://localhost:3000/u/1

router.delete('/:id', function (req, res) {
	const id = parseInt(req.params.id);
	let client = null;

	console.log(`Received request: DELETE /u/${id}`);

	MongoClient.connect(url)
		.then(_client => {
			console.log(`DELETE /u/${id} : Connected successfully to the server ${url}`);

			client = _client;

			const db = client.db(dbName);
			const collection = db.collection(collectionName);
			const filter = { id: id };

			return collection.deleteOne(filter);
		})
		.then(_ => {
			const message = `DELETE /u/${id} : Completed.`;

			console.log(message);
			client.close();
			res.status(200).send(message);
		})
		.catch(error => {

			if (client) {
				client.close();
			}

			const errorMessage = `DELETE /u/${id} : Error: ${error.message || error}`;

			console.error(errorMessage);
			res.status(500).send(errorMessage);
		});
});

app.use('/u', router);

module.exports = {
	app: app
};

// End of File.
