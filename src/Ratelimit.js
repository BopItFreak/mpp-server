
var RateLimit = function(interval_ms) {
	this._interval_ms = interval_ms || 0; // (0 means no limit)
	this._after = 0;
};

RateLimit.prototype.attempt = function(time) {
	var time = time || Date.now();
	if(time < this._after) return false;
	this._after = time + this._interval_ms;
	return true;
};

RateLimit.prototype.setInterval = function(interval_ms) {
	this._after += interval_ms - this._interval_ms;
	this._interval_ms = interval_ms;
};

var RateLimitChain = function(num, interval_ms) {
	this.setNumAndInterval(num, interval_ms);
};

RateLimitChain.prototype.attempt = function(time) {
	var time = time || Date.now();
	for(var i = 0; i < this._chain.length; i++) {
		if(this._chain[i].attempt(time)) return true;
	}
	return false;
};

RateLimitChain.prototype.setNumAndInterval = function(num, interval_ms) {
	this._chain = [];
	for(var i = 0; i < num; i++) {
		this._chain.push(new RateLimit(interval_ms));
	}
};

var exports = typeof module !== "undefined" ? module.exports : this;
exports.RateLimit = RateLimit;
exports.RateLimitChain = RateLimitChain;