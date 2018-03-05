// vt-server/src/app.js

// A MongoDB REST Web service.

'use strict';

//const Rx = require('rxjs/Rx');

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// npm i --save body-parser
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

// 1) Create

function insertOneDocument(university) {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				reject(error);
			}

			console.log('Connected successfully to the server', url);

			const db = client.db(dbName);

			const collection = db.collection(collectionName);
			let query = { id: id };
			//let query = { $expr: { $eq: [ "$id", id ] } };

			collection.insertOne(university, function(error, result) {
				client.close();

				if (error) {
					reject(error);
				}

				console.log('collection.insertOne() returned:', result);
				resolve(result);
			});
		});
	});
}

// 2) Read

function findOneDocumentById(db, collectionName, id) {
	return new Promise((resolve, reject) => {
		const collection = db.collection(collectionName);
		let query = { id: id };
		//let query = { $expr: { $eq: [ "$id", id ] } };

		collection.findOne(query, function(error, result) {

			if (error) {
				reject(error);
			}

			console.log('collection.findOne() returned:', result);
			resolve(result);
		});
	});
}

function getOneDocumentById(id) {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				reject(error);
			}

			console.log('Connected successfully to the server', url);

			const db = client.db(dbName);

			findOneDocumentById(db, collectionName, id)
				.then(result => {
					console.log('Success!');
					//console.log('Result of find:', result);
					client.close();
					resolve(result);
				})
				.catch(error2 => {
					console.error('Error caught:', error2);
					client.close();
					reject(error2);
				});
		});
	});
}

// 3) Update

function updateOneDocumentById(id, university) {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				reject(error);
			}

			console.log('Connected successfully to the server', url);

			const db = client.db(dbName);

			const collection = db.collection(collectionName);
			let query = { id: id };
			//let query = { $expr: { $eq: [ "$id", id ] } };

			collection.updateOne(query, university, function(error, result) {
				client.close();

				if (error) {
					reject(error);
				}

				console.log('collection.updateOne() returned:', result);
				resolve(result);
			});
		});
	});
}

// 4) Delete

function deleteOneDocumentById(id) {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				reject(error);
			}

			console.log('Connected successfully to the server', url);

			const db = client.db(dbName);

			const collection = db.collection(collectionName);
			let query = { id: id };

			collection.deleteOne(query, function(error, result) {
				client.close();

				if (error) {
					reject(error);
				}

				console.log('collection.deleteOne() returned:', result);
				resolve(result);
			});
		});
	});
}

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

router.post('/', function (req, res) {
	console.log('Received request: POST /u/');
	//console.log('Request is:', req);
	//console.log('Request.body is:', req.body);

	const university = req.body;

	insertOneDocument(university)
		.then(_ => {
			// HTTP status code 201 means Created.
			res.status(201).send(`Successful POST of University ${university}`);
		})
		.catch(error => {
			console.error(`POST /u/ : Error: ${error}`);
			res.status(500).send(error.message || error);
		});
});

// 2) Read (the R in CRUD)

// Test via curl -X "GET" http://localhost:3000/u/ or simply curl http://localhost:3000/u/

router.get('/', function (req, res) {
	console.log('Received request: GET /u/');

	MongoClient.connect(url, function(error, client) {
		//assert.equal(null, error);
		
		if (error) {
			console.error(`GET /u/ : Database connection error: ${error}`);
			res.status(500).send(error.message || error);
		}

		console.log(`GET /u/ : Connected successfully to the server ${url}`);

		const db = client.db(dbName);
		const collection = db.collection(collectionName);

		// Use collection.find().toArray()
		// See https://stackoverflow.com/questions/35246713/node-js-mongo-find-and-return-data

		collection.find().toArray()
			.then(universities => {
				client.close();
				console.log(`GET /u/ : Returning result: ${universities}`);
				res.json(universities);
			})
			.catch(error => {
				client.close();
				console.error(`GET /u/ : collection.find().toArray() error: ${error}`);
				res.status(500).send(error.message || error);
			});
	});
});

// Test via curl -X "GET" http://localhost:3000/u/1 or simply curl http://localhost:3000/u/1

router.get('/:id', function (req, res) {
	const id = parseInt(req.params.id);
	
	console.log(`Received request: GET /u/${id}`);

	getOneDocumentById(id)
		.then(university => {
			console.log('university is', university);
			
			if (university) {
				res.json(university);
			} else {
				let errorMessage = 'University with ID ' + id + ' not found.';

				console.error('GET /u/' + id.toString(), ': Error:', errorMessage);
				res.status(404).send(errorMessage);
			}
		})
		.catch(error => {
			console.error('GET /u/' + id.toString(), ': Error caught:', error);
			res.status(500).send(error.message || error);
		});
});

// 3) Update (the U in CRUD)

// Test via: curl -X "PUT" http://localhost:3000/u/1

router.put('/:id', function (req, res) {
	const id = parseInt(req.params.id);

	console.log(`Received request: PUT /u/${id}`);

	const university = req.body;

	updateOneDocumentById(id, university)
		.then(_ => {
			res.status(200).send(`Successful PUT of University ${id}.`);
		})
		.catch(error => {
			console.error(`PUT /u/${id} : Error: ${error}`);
			res.status(500).send(error.message || error);
		});
});

// 4) Delete (the D in CRUD)

// Test via: curl -X "DELETE" http://localhost:3000/u/1

router.delete('/:id', function (req, res) {
	const id = parseInt(req.params.id);

	console.log(`Received request: DELETE /u/${id}`);

	deleteOneDocumentById(id)
		.then(_ => {
			res.status(200).send(`Successful DELETE of University ${id}.`);
		})
		.catch(error => {
			console.error(`DELETE /u/${id} : Error: ${error}`);
			res.status(500).send(error.message || error);
		});
});

app.use('/u', router);

module.exports = {
	app: app
};

// End of File.
