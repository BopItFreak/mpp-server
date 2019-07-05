class Quota {
    constructor(cb) {
        this.cb = cb;
        this.setParams();
        this.resetPoints();
    };
    static NQ_PARAMS_LOBBY = {
        allowance: 200,
        max: 600
    };
    static NQ_PARAMS_NORMAL = {
        allowance: 400,
        max: 1200
    };
    static NQ_PARAMS_RIDICULOUS = {
        allowance: 600,
        max: 1800
    };
    static NQ_PARAMS_OFFLINE = {
        allowance: 8000,
        max: 24000,
        maxHistLen: 3
    };
    static CH_PARAMS = {
        allowance: 8000,
        max: 24000,
        maxHistLen: 3
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
        params = params || NoteQuota.PARAMS_OFFLINE;
        var allowance = params.allowance || this.allowance || NoteQuota.PARAMS_OFFLINE.allowance;
        var max = params.max || this.max || NoteQuota.PARAMS_OFFLINE.max;
        var maxHistLen = params.maxHistLen || this.maxHistLen || NoteQuota.PARAMS_OFFLINE.maxHistLen;
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
module.exports = Quota;