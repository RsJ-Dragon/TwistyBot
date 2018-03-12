let RuneWatch = src_require('apis/RuneWatch');

module.exports = async function(client) {
	// Load all existing RW posts
	let cache_promise = RuneWatch.init_cache();

	// Don't wait for RuneWatch cache to load before logging in
	return config.faststart ? Promise.resolve() : cache_promise;
};
