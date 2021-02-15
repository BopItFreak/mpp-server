//Adaptation of https://gist.github.com/brandon-lockaby/7339587 into modern javascript.
/*
class RateLimit {
    constructor(interval_ms) {
	    this._interval_ms = interval_ms || 0; // (0 means no limit)
        this._after = 0;
    }
    attempt(time) {
        var time = time || Date.now();
        if(time < this._after) return false;
        this._after = time + this._interval_ms;
        return true;
    };

    interval(interval_ms) {
        this._after += interval_ms - this._interval_ms;
        this._interval_ms = interval_ms;
    };
}

class RateLimitChain(num, interval_ms) {
    constructor(num, interval_ms) {
        this.setNumAndInterval(num, interval_ms);
    }  

    attempt(time) {
        var time = time || Date.now();
        for(var i = 0; i < this._chain.length; i++) {
            if(this._chain[i].attempt(time)) return true;
        }
        return false;
    };

    setNumAndInterval(num, interval_ms) {
        this._chain = [];
        for(var i = 0; i < num; i++) {
            this._chain.push(new RateLimit(interval_ms));
        }
    };
}*/

class Quota {
    constructor(params, cb) {
        this.cb = cb;
        this.setParams(params);
        this.resetPoints();
        this.interval;
    };
    static N_PARAMS_LOBBY = {
        allowance: 200,
        max: 600,
        interval: 2000
    };
    static N_PARAMS_NORMAL = {
        allowance: 400,
        max: 1200,
        interval: 2000
    };
    static N_PARAMS_RIDICULOUS = {
        allowance: 600,
        max: 1800,
        interval: 2000
    };
    static PARAMS_OFFLINE = {
        allowance: 8000,
        max: 24000,
        maxHistLen: 3,
        interval: 2000
    };
    static PARAMS_A_NORMAL = {
        allowance: 4,
        max: 4,
        interval: 6000
    };
    static PARAMS_A_CROWNED = {
        allowance:10,
        max:10,
        interval: 2000
    }
    static PARAMS_CH = {
        allowance: 1,
        max: 2,
        interval: 1000
    }
    static PARAMS_USED_A_LOT = {
        allowance:1,
        max:1,
        interval: 2000
    }
    static PARAMS_M = {
        allowance:15000,
        max:500000,
        interval: 2000
    }
    getParams() {
        return {
            m: "nq",
            allowance: this.allowance,
            max: this.max,
            maxHistLen: this.maxHistLen
        };
    };
    setParams(params) {
        params = params || Quota.PARAMS_OFFLINE;
        var allowance = params.allowance || this.allowance || Quota.PARAMS_OFFLINE.allowance;
        var max = params.max || this.max || Quota.PARAMS_OFFLINE.max;
        var maxHistLen = params.maxHistLen || this.maxHistLen || Quota.PARAMS_OFFLINE.maxHistLen;
        let interval = params.interval || 0;
	clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.tick();
        }, params.interval)
        if (allowance !== this.allowance || max !== this.max || maxHistLen !== this.maxHistLen) {
            this.allowance = allowance;
            this.max = max;
            this.maxHistLen = maxHistLen;
            this.resetPoints();
            return true;
        }
        return false;
    };
    resetPoints() {
        this.points = this.max;
        this.history = [];
        for (var i = 0; i < this.maxHistLen; i++)
            this.history.unshift(this.points);
        if (this.cb) this.cb(this.points);
    };
    tick() {
        // keep a brief history
        this.history.unshift(this.points);
        this.history.length = this.maxHistLen;
        // hook a brother up with some more quota
        if (this.points < this.max) {
            this.points += this.allowance;
            if (this.points > this.max) this.points = this.max;
            // fire callback
            if (this.cb) this.cb(this.points);
        }
    };
    spend(needed) {
        // check whether aggressive limitation is needed
        var sum = 0;
        for (var i in this.history) {
            sum += this.history[i];
        }
        if (sum <= 0) needed *= this.allowance;
        // can they afford it?  spend
        if (this.points < needed) {
            return false;
        } else {
            this.points -= needed;
            if (this.cb) this.cb(this.points); // fire callback
            return true;
        }
    };
}

module.exports = Quota
