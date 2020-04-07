function RateLimit(a,b){
	this.a = b.a || 1;
	this.m = b.m || 10;
	this.mh = b.mh || 3;
	this.setParams(a,{a:this.a,m:this.m,mh:this.mh});
	this.resetPoints();
	if(a !== null){
		var self = this;
		this.giveInt = setInterval(()=>{self.give()},a);
	};
};
RateLimit.prototype.setParams = function(a,b){
	var a = b.a || this.a || 1;
	var m = b.m || this.m || 5;
	var mh = b.mh || this.mh || 3;
	clearInterval(this.giveInt);
	this.giveInt = undefined;
	if(a !== this.a || m !== this.m || mh !== this.mh){
		this.a = a;
		this.m = m;
		this.mh = mh;
		this.resetPoints();
		if(a !== null){
			var self = this;
			this.giveInt = setInterval(()=>{self.give()},a);
		};
		return true;
	};
	return false;
};
RateLimit.prototype.resetPoints = function(){
	this.points = this.m;
	this.history = [];
	for(var i=0; i<this.mh; i++) this.history.unshift(this.points);
};
RateLimit.prototype.give = function(){
	this.history.unshift(this.points);
	this.history.length = this.mh;
	if(this.points < this.m){
		this.points += this.a;
		if(this.points > this.m) this.points = this.m;
	};
};
RateLimit.prototype.spend = function(needed){
	var sum = 0;
	for(var i in this.history){
		sum += this.history[i];
	};
	if(sum <= 0) needed *= this.a;
	if(this.points < needed){
		return false;
	}else{
		this.points -= needed;
		return true;
	};
};

module.exports = RateLimit;