#!/usr/bin/env node

// vt-server/src/app.js

// A MongoDB REST Web service.

'use strict';

const ingest = require('./ingest');

ingest()
	.then(_ => {
		const message = 'POST /u/ingest : Completed.';

		console.log(message);
	})
	.catch(error => {
		const errorMessage = `POST /u/ingest : Error: ${error.message || error}`;

		console.error(errorMessage);
	});
