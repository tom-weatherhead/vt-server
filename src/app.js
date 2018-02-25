// vt-server/src/app.js

// A MongoDB REST Web service.

'use strict';

const express = require('express');
var cors = require('cors');

const app = express();

app.use(cors());
//app.disable('etag');	// Prevent HTTP 304 Not Modified. See https://stackoverflow.com/questions/18811286/nodejs-express-cache-and-304-status-code

const router = express.Router();				// eslint-disable-line new-cap

const config = require('../config/config');

const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

const url = config.databaseUrl;
const dbName = config.databaseName;
const collectionName = config.collectionName;

/*
function mapFixFloats(university) {
	return {
		id: parseInt(university.id),
		name: university.name,
		shortName: university.shortName,
		numUndergraduateStudents: parseInt(university.numUndergraduateStudents),
		percentWhite: parseFloat(university.percentWhite) * 100.0,
		percentBlack: parseFloat(university.percentBlack) * 100.0,
		percentHispanic: parseFloat(university.percentHispanic) * 100.0,
		percentAsian: parseFloat(university.percentAsian) * 100.0,
		percentAmericanNative: parseFloat(university.percentAmericanNative) * 100.0,
		percentPacificIslander: parseFloat(university.percentPacificIslander) * 100.0,
		percentMultipleRaces: parseFloat(university.percentMultipleRaces) * 100.0,
		percentNonResidentAlien: parseFloat(university.percentNonResidentAlien) * 100.0,
		percentUnknown: parseFloat(university.percentUnknown) * 100.0,
		funk: 1
	};
}
*/

function findDocuments(db, collectionName) {
	return new Promise((resolve, reject) => {
		const collection = db.collection(collectionName);
		let query = {};

		collection.find(query, function(error, cursor) {
			//let result = cursor.toArray();		// result is a Promise.

			if (error) {
				reject(error);
			}

			cursor.toArray().then(result => {
				//console.log('collection.find().toArray() returned:', result);
				//resolve(result.map(mapFixFloats));
				resolve(result);
			})
			.catch(error2 => {
				console.error('collection.find().toArray() : Error caught:', error2);
				reject(error2);
			});
		});
	});
}

function findOneDocumentById(db, collectionName, id) {
	// The insert command returns an object with the following fields:

	// - result : Contains the result document from MongoDB
	// - ops : Contains the documents inserted with added _id fields
	// - connection : Contains the connection used to perform the insert

	return new Promise((resolve, reject) => {
		const collection = db.collection(collectionName);
		let query = { id: id };
		//let query = { $expr: { $eq: [ "$id", id ] } };

		collection.findOne(query, function(error, result) {

			if (error) {
				reject(error);
			}

			console.log('collection.findOne() returned:', result);
			//resolve(mapFixFloats(result));
			resolve(result);
		});
	});
}

function getAll() {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				reject(error);
			}

			console.log('Connected successfully to the server', url);

			const db = client.db(dbName);

			findDocuments(db, collectionName)
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

router.get('/', function (req, res) {
	console.log('Received request: GET /u/');

	getAll()
		.then(universities => {
			res.json(universities);
		})
		.catch(error => {
			console.error('GET /u/ : Error caught:', error);
			res.status(500).send(error.message || error);
		});
});

router.get('/:id', function (req, res) {
	let id = parseInt(req.params.id);
	let resultString = 'University number ' + id;
	
	console.log(resultString);
	
	console.log('Received request: GET /u/' + id.toString());

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

app.use('/u', router);

module.exports = {
	app: app
};

// End of File.
