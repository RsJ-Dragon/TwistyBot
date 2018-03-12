let request = require('request-promise-native');
let querystring = require('querystring');

class RateLimiter
{
	constructor(success_limit_ms, fail_limit_ms)
	{
		// Time between successful requests
		this.success_limit_ms = success_limit_ms;
		// Time between failed requests
		this.fail_limit_ms = fail_limit_ms;

		this.jobs = [];
		this.task = Promise.resolve();
	}

	// Create a job to be run at a later time
	// Useful response properties:
	/*
		res
			.req
				.method
				.path => '/v1/api/account/me'
			.request
				.uri
					.protocol => 'https:'
					.host => 'api.iotashome.com'
					.port => 443
					.hostname => 'api.iotashome.com'
					+ more
				.href => 'https://api.iotashome.com/v1/api/account/me'
			.headers
			.body
			.statusCode
			.statusMessage

	*/

	// Parameter must be a job object
	// job.url = "http://..."
	// job.method = "GET"
	// job.headers = {...}
	// See all at: https://www.npmjs.com/package/request#requestoptions-callback
	queue(job)
	{
		// Time when the job was created
		job.timestamp = Date.now();
		// Number of attempts made to get a successful response
		job.attempt = 0;
		// Priority over other jobs - higher values will execute first
		job.priority = job.priority || 0;
		// Maximum number of attempts that can be made before giving up
		job.retries = job.retries || 0;
		// A function that validates the response
		job.validate = job.validate || (res => res.statusCode == 200);

		// Return full response object
		job.resolveWithFullResponse = true;
		// Don't throw because of non 2xx status
		job.simple = false;

		// Create a promise that will be resolved later when the request is finished
		job.promise = new Promise(function(resolve, reject) {
			job.resolve = resolve;
			job.reject = reject;
		});

		this.push(job);
		return job.promise;
	}

	// Reshuffle a job into the priority queue
	push(job)
	{
		// We use queue.pop() to get the next job, so the last element should be the request with highest priority
		this.jobs.push(job);
		this.jobs.sort(function(a,b) {
			// Sort by highest priority then by lowest timestamp
			return (a.priority == b.priority) ? b.timestamp - a.timestamp : a.priority - b.priority;
		});

		// Run another job whenever the last task finishes
		this.task = this.task.then( () => this.run() );
	}

	// Run a request from the job on top of the queue
	// Resolves when the next job is allowed to run
	async run()
	{
		// Get next job
		let job = this.jobs.pop();
		job.attempt += 1;
		console.info(
			'[' + job.attempt + '/' + (job.retries+1) + '] ' +	job.url +
			(job.qs ? '?' + querystring.stringify(job.qs) : '')
		);

		let res;

		try
		{
			// Make the request
			res = await request(job);

			// Check the response
			if (job.validate(res))
			{
				job.resolve(res);
				return new Promise(resolve => setTimeout(resolve, this.success_limit_ms));
			}
		}
		catch(err)
		{
			// todo: save this error message
			console.warn(err);
		}

		// Check if we are out of retries
		if (job.attempt > job.retries)
		{
			let err = new Error('Too many failed requests');
			err.url = job.url + (job.qs ? '?' + querystring.stringify(job.qs) : '');

			// Apparently it's possible for res to be undefined
			// Maybe connect ETIMEDOUT or getaddrinfo ENOTFOUND
			// Seems it's also possible if the site has too many redirects
			if (res)
			{
				err.status = res.statusCode + ' ' + res.statusMessage;
				err.body = res.body || '';
			}
			else
			{
				err.oops = 'res is not defined!';
			}
			job.reject(err);
		}
		else
		{
			this.push(job);	// Back into the queue
		}

		return new Promise(resolve => setTimeout(resolve, this.fail_limit_ms));
	}
}

RateLimiter.cache = {};

module.exports = RateLimiter;
