// src/ingest.js

'use strict';

var csv_parse = require('csv-parse');
var fs = require('fs');
var path = require('path');

const config = require('../config/config');

console.log('config is', config);

const safelyDropCollection = (db, collectionName) => {
	// See https://docs.mongodb.com/manual/reference/method/db.collection.drop/

	return new Promise((resolve, reject) => {
		db.collection(collectionName).drop()
			.then(result => {
				// console.log('Drop collection: success!', result);
				resolve(result);
			}, error => {
				
				if (error.code === 26) {
					// console.log('Drop collection: Collection does not exist.');
					resolve('Drop: Collection ' + collectionName + ' does not exist.');
				} else {
					console.error('Drop collection: error:', error);
					reject(error);
				}
			});
	});
};

const getData = () => {
	return new Promise((resolve, reject) => {
		// TODO: Generate and use an absolute path to the .csv file.
		// E.g. Use the npm package app-root-path:
		// See https://www.npmjs.com/package/app-root-path

		var appRoot = require('app-root-path');

		console.log('app-root-path: appRoot is', appRoot);

		//const srcFilePath = './data/Dataset_presentation.csv';
		const srcFilePath = path.join(appRoot.path, 'data/Dataset_presentation.csv');

		// Re: 'utf8' : See https://stackoverflow.com/questions/6456864/why-does-node-js-fs-readfile-return-a-buffer-instead-of-string
		fs.readFile(srcFilePath, 'utf8', function (errorReadFile, fileContents) {

			if (errorReadFile) {
				const error = new Error('Error while reading the file:' + errorReadFile);
				
				console.error(error.message);
				reject(error);
			} else {
				//console.log('fileContents:', fileContents);

				var csv_parse_options = {};
				// var csv_parse_options = { comment: '#' };

				csv_parse(fileContents, csv_parse_options, (errorCsvParse, output) => {
					
					if (errorCsvParse) {
						const error = new Error('.csv parsing error:' + errorCsvParse);

						console.error(error.message);
						reject(error);
					} else {
						const keyNames = [
							'Institution Id',
							'Institution',
							'City',
							'State',
							'Institute URL',
							'Predominant degree awarded',
							'Type of Institution',
							'Locale',
							'25th percentile of SAT scores at the institution (critical reading)',
							'75th percentile of SAT scores at the institution (critical reading)',
							'25th percentile of SAT scores at the institution (math)',
							'75th percentile of SAT scores at the institution (math)',
							'25th percentile of SAT scores at the institution (writing)',
							'75th percentile of SAT scores at the institution (writing)',
							'Midpoint of SAT scores at the institution (critical reading)',
							'Midpoint of SAT scores at the institution (math)',
							'Midpoint of SAT scores at the institution (writing)',
							'25th percentile of the ACT cumulative score',
							'75th percentile of the ACT cumulative score',
							'Percentage of degrees awarded in Agriculture, Agriculture Operations, And Related Sciences',
							'Percentage of degrees awarded in Natural Resources And Conservation',
							'Percentage of degrees awarded in Architecture And Related Services',
							'Percentage of degrees awarded in Communication, Journalism, And Related Programs',
							'Percentage of degrees awarded in Computer And Information Sciences And Support Services',
							'Percentage of degrees awarded in Engineering',
							'Percentage of degrees awarded in Foreign Languages, Literatures, And Linguistics',
							'Percentage of degrees awarded in Family And Consumer Sciences/Human Sciences',
							'Percentage of degrees awarded in Psychology',
							'Percentage of degrees awarded in Public Administration And Social Service Professions',
							'Percentage of degrees awarded in Social Sciences',
							'Percentage of degrees awarded in Visual And Performing Arts',
							'Percentage of degrees awarded in Business, Management, Marketing, And Related Support Services',
							'Undergraduate Students',
							'% White',
							'% Black',
							'% Hispanic',
							'% Asian',
							'% American Indian/Alaska Native',
							'% Native Hawaiian/Pacific Islander',
							'% Two or More races',
							'% Non Resident Alien',
							'% Unknown',
							'% share of part-time students',
							'Percent Full Time Students',
							'Average Annual Cost',
							'Average Annual Cost ($) by family income group - $0 to $30000',
							'Average Annual Cost ($) by family income group - $30001 to $48000',
							'Average Annual Cost ($) by family income group - $48001to $75000',
							'Average Annual Cost ($) by family income group - $75001 to $110000',
							'Average Annual Cost ($) by family income group - 110001+',
							'Socio-Economic Diversity (% of Student Receiving Pell Grant)',
							'First-time, full-time student retention rate at four-year institutions (%)',
							'First-time, part-time student retention rate at four-year institutions (%)',
							'% Student Receiving Federal Loans',
							'Salary After Attending ($)',
							'% Earning above High School Grad',
							'Typical Total Debt ($)',
							'Typical Monthly Loan Payment ($/month)',
							'Students Paying Down Their Debt (%)',
							'Completion rate for first-time and full-time students at four-year institutions',
							'National Average Annual Cost',
							'National Average Students Paying Down Their Debt (%)',
							'National Average - Salary After Attending',
							'National Average - Graduation rate (%)',
							'National Average - First-time, full-time student retention rate at four-year institutions (%)'
						];
						const mapCamelCaseColumnNames = {
							'Institution Id': 'id',
							'Institution': 'name',
							//'': 'shortName',
							'Undergraduate Students': 'numUndergraduateStudents',
							'% White': 'percentWhite',
							'% Black': 'percentBlack',
							'% Hispanic': 'percentHispanic',
							'% Asian': 'percentAsian',
							'% American Indian/Alaska Native': 'percentAmericanNative',
							'% Native Hawaiian/Pacific Islander': 'percentPacificIslander',
							'% Two or More races': 'percentMultipleRaces',
							'% Non Resident Alien': 'percentNonResidentAlien',
							'% Unknown': 'percentUnknown'
						};
						const mapNamesToShortNames = {
							'North Carolina State University at Raleigh' : 'NCSU Raleigh',
							'Texas A & M University-College Station': 'Tx A&M Clg Stn',
							'The University of Texas at Austin': 'U T Austin',
							'Virginia Polytechnic Institute and State University': 'Virginia Tech',
							'University of Virginia-Main Campus': 'U Va Main'
						};
						//var rowLengths = [];
						//var numberOfRowsWithUnexpectedLength = 0;
						const headers = output[0];

						// console.log('Parsed data from the .csv file:', output);
						// console.log('Headers:', headers);
						//rowLengths.push(headers.length);

						// The slice(1) omits the first row of the array, which contains the column headers.
						output = output.slice(1).map(function (row) {
							//rowLengths.push(row.length);
							
							// if (row.length != headers.length) {
								// numberOfRowsWithUnexpectedLength = numberOfRowsWithUnexpectedLength + 1;
							// }

							var rowObject = {};
							const numColumnsInRowObject = Math.min(row.length, headers.length);

							for (var i = 0; i < numColumnsInRowObject; ++i) {
								// To successfully insert an object into Mongo, no key can contain a '.'
								//rowObject[keyNames[i]] = row[i];
								
								let camelCaseColumnName = mapCamelCaseColumnNames[keyNames[i]];
								
								if (camelCaseColumnName) {
									let value = row[i];

									if (camelCaseColumnName === 'id' || camelCaseColumnName === 'numUndergraduateStudents') {
										value = parseInt(value);
									} else if (camelCaseColumnName.startsWith('percent')) {
										value = Math.round(parseFloat(value) * 10000.0) / 100.0;
									}

									rowObject[camelCaseColumnName] = value;
								}
							}

							// rowObject['percentUnknown'] = 100.0 - all of the other percentages?
							// If so, then what if rowObject['percentUnknown'] < 0 ?

							rowObject['shortName'] = mapNamesToShortNames[rowObject['name']];

							return rowObject;
						});

						// console.log('Before call to insert');
						resolve(output);
					}
				});
			}
		});
	});
};

const insertDocuments = (db, collectionName, records) => {
	// The insert command returns an object with the following fields:

	// - result : Contains the result document from MongoDB
	// - ops : Contains the documents inserted with added _id fields
	// - connection : Contains the connection used to perform the insert

	return new Promise((resolve, reject) => {
		const collection = db.collection(collectionName);

		collection.insertMany(records, function(error, result) {
			
			if (error) {
				reject(error);
			}

			console.log('Inserted ' + result.ops.length + ' documents into the collection \'' + collectionName + '\'.');
			resolve(result);
		});
	});
}

function ingest() {
	const MongoClient = require('mongodb').MongoClient;

	const url = config.databaseUrl;
	const dbName = config.databaseName;
	const collectionName = config.collectionName;

	let client = null;
	let db = null;

	return MongoClient.connect(url)
		.then(_client => {
			console.log('Connected successfully to the server', url);

			client = _client;
			db = client.db(dbName);

			return safelyDropCollection(db, collectionName);
		})
		.then(result => {
			return getData();
		})
		.then(records => {
			return insertDocuments(db, collectionName, records);
		})
		.then(result => {
			console.log('Success!');
			//console.log('Result of insert:', result);
			client.close();
			return Promise.resolve(result);
		})
		.catch(error => {
			console.error('Error caught:', error);

			if (client) {
				client.close();
			}

			return Promise.reject(error);
		});
}

module.exports = ingest;

// End of File.
