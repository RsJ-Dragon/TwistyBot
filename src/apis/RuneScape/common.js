// Create a rate limiter for RuneScape's api
let RateLimiter = src_require('classes/RateLimiter');
module.exports.limiter = new RateLimiter(1000, 5000);
