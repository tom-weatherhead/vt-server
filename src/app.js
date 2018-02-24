// thaw-tic-tac-toe-web-service/src/app.js

// A Web server that makes the functionality in the Tic-Tac-Toe engine in thaw-tic-tac-toe-engine available as a Web service.

'use strict';

const express = require('express');
const app = express();

const router = express.Router();				// eslint-disable-line new-cap

const config = require('../config/config');

const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

const url = config.databaseUrl;
const dbName = config.databaseName;
const collectionName = config.collectionName;

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
		//let query = { id: id };
		let query = { $expr: { $eq: [ "$id", id.toString() ] } };

		collection.findOne(query, function(error, result) {
			//let result = cursor.toArray();		// result is a Promise.

			if (error) {
				reject(error);
			}

			console.log('collection.findOne() returned:', result);
			resolve(result);
			// cursor.toArray().then(result => {
				// console.log('collection.find().toArray() returned:', result);
				// resolve(result);
			// })
			// .catch(error2 => {
				// console.error('collection.find().toArray() : Error caught:', error2);
				// reject(error2);
			// });
		});
	});
}

function getAll() {
	return new Promise((resolve, reject) => {
		MongoClient.connect(url, function(error, client) {
			//assert.equal(null, error);
			
			if (error) {
				console.error('Fatal: Connection error:', error);
				//return;
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
				//return;
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

/*
router.get('/:board([EXO]{9})/:maxPly([0-9]{1})', function (req, res) {
	// Global replace in string: See https://stackoverflow.com/questions/38466499/how-to-replace-all-to-in-nodejs
	const boardString = req.params.board.replace(/E/g, ' ');		// Replaces all 'E' with ' '.
	const maxPly = parseInt(req.params.maxPly, 10);

	try {
		const result = gameEngine.findBestMove(boardString, maxPly);

		res.json(result);
	} catch (error) {
		// For a description of the Node.js Error class, see https://nodejs.org/api/errors.html#errors_class_error
		res.status(500).send(error.message);
	}
});
*/

router.get('/', function (req, res) {
	// let resultString = 'All universities';
	
	// console.log(resultString);
	// console.log(universities);

	//res.json(universities);

	getAll()
		.then(universities => {
			res.json(universities);
		})
		.catch(error => {
			console.error('Error caught:', error);
			res.status(500).send(error.message || error);
		});
});

router.get('/:id', function (req, res) {
	let id = parseInt(req.params.id);
	let resultString = 'University number ' + id;
	
	console.log(resultString);
	
	getOneDocumentById(id)
		.then(university => {
			console.log('university is', university);
			
			if (university) {
				res.json(university);
			} else {
				let errorMessage = 'University with ID ' + id + ' not found.';

				console.error(errorMessage);
				res.status(404).send(errorMessage);
			}
		})
		.catch(error => {
			console.error('Error caught:', error);
			res.status(500).send(error.message || error);
		});
});

app.use('/u', router);

module.exports = {
	app: app
};

// End of File.
