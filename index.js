'use strict';


/*
Supported API

on (eventName, callback, *context):
	* should allow to register a callback to event and allow optional context to be invoked to
off (eventName, *callback)
	* should allow remove registered callbacks of the specified eventName
	* BONUS: should allow unregister a previously registered event and callback
trigger (eventName, data)
	* should allow triggering an eventName and send arguments (data object) that will be passed to a callback as an argument
	* BONUS: allow to send several data arguments as: trigger('myevent', arg1, arg2, arg3);
*/

/*
	CHALLENGE 1 A : Please write the source code of “EventsManager” Object
*/

class Channel {
	constructor(name) {
		this.name = name;
		this.listeners = [];
	}
	addListener(cb, ctx={type: this.name}) {
		this.listeners.push({cb, ctx});
		return this.listeners.length;
	}
	removeListener(cb=null) {
		if (!cb) {
			this.listeners = [];
		} else if ('function' === typeof cb) {
			let index = this.listeners.findIndex(listener => listener.cb === cb);
			if (index > -1) {
				this.listeners = [...this.listeners.splice(0, index), ...this.listeners.splice(1)];
			}
		}
		return this.listeners.length;
	}
	emit(arg) {
		this.listeners.forEach(listeners => {
			listeners.cb.call(listeners.ctx, ...arg);
		});
	}
}

class PubSub {
	constructor() {
		this.channels = {};
	}
	on(channelName, cb, ctx) {
		if (Array.isArray(channelName)) {
			return channelName.map(name => this.on(name, cb, ctx), this);
		}
		if ('string' !== typeof channelName || 'function' !== typeof cb) {
			return null;
		}
		if ('undefined' === typeof this.channels[channelName]) {
			// create new Channel
			this.channels[channelName] = new Channel(channelName);
		}
		this.channels[channelName].addListener(cb, ctx);
		return this.off.bind(this, channelName, cb);
	}
	off(channelName, cb) {
		if (Array.isArray(channelName)) {
			let res = channelName.map(name => this.off(name, cb), this);
			return res.find(obj => obj === null)? null : this;
		}
		if ('string' !== typeof channelName || 'undefined' === typeof this.channels[channelName]) {
			return null;
		}
		if (0 === this.channels[channelName].removeListener(cb)) {
			delete this.channels[channelName];
		}
		return this;
	}
	trigger(channelName, ...args) {
		if (Array.isArray(channelName)) {
			let res = channelName.map(name => this.trigger(name, ...args), this);
			return res.find(obj => obj === null)? null : this;
		}
		if ('string' !== typeof channelName || 'undefined' === typeof this.channels[channelName]) {
			return null;
		}
		this.channels[channelName].emit(args);
		return this;
	}
}

function EventsManager() {
	return new PubSub();
}


var MyEventsManager = EventsManager();
/*
	CHALLENGE 1 B : Please write the source code of “Person”
*/

function Person(name, eventManager) {
	this.name = name || 'anonym';
	if (!(eventManager instanceof PubSub)) {
		throw new Error('eventManager has to be instance of PubSub');
	}
	this.eventManager = eventManager;
	this.foods = [];
}


Person.prototype.waitToEat = function() {
	this.eventManager.on('breakfast:ready', this.eat, this);
};

Person.prototype.eat = function(foods) {
	console.log("i'm", this.name, "and i'm eating", foods.join(","));
	this.foods.length = 0;
	this.foods = foods;
	this.eventManager.trigger('eat:done', this);
};

Person.prototype.finishEat = function(time) {
	console.log("i'm", this.name, "and i finished eating at", time);
	this.eventManager.off("breakfast:ready", this.finishEat);
};

// logFood method has a task ahead
Person.prototype.logFood = function() {
	this.foods.forEach(function(item){
		console.log("I'm " + this.name + " and I ate " + item);
	}, this);
};

Person.prototype.logFood = function() {
	this.foods.forEach(function(item){
		console.log("I'm " + this.name + " and I ate " + item);
	}, this);
};


/*
	NOTICE: After you add your code of EventsManager you should run all the code and test your success with the code below.
	Meaning, the code below should work without any errors
*/

// start the app
MyEventsManager.on('eat:done', function(person){
	console.log(person.name, "finished eating");
});
MyEventsManager.on('breakfast:ready', function(menu){
	console.log("breakfast is ready with:", menu);
});
var john = new Person('john', MyEventsManager);
john.waitToEat();

MyEventsManager.on('eat:done', function(person){
	person.finishEat(new Date());
});
var breakfast = ["scrambled eggs", "tomatoes", "bread", "butter"];
MyEventsManager.trigger('breakfast:ready', breakfast);


/*
	CHALLENGE 2: Please FIX the source code of “logFood” according to the instructions:
		* this “logFood” method throws an error. "this.name" doesn't print the Person's name
	Please suggest 2 different solutions (by adding the relevant fix code) so "this.name" will print the relevant name
*/

// First solution
Person.prototype.logFood = function() {
	this.foods.forEach(function(item){
		var msg = "I'm " + this.name + " and I ate " + item;
		console.log(msg);
	}, this);
};
/*
// Second solution
Person.prototype.logFood = function() {
	var name = this.name;
	this.foods.forEach(function(item){
		console.log("I'm " + name + " and I ate " + item);
	});
};

// but there are many solutions to fix it
Person.prototype.logFood = function() {
	this.foods.forEach((item) => {
		console.log("I'm " + this.name + " and I ate " + item);
	});
};

Person.prototype.logFood = function() {
	this.foods.forEach(printLog.bind(this));
	function printLog(item) {
		console.log("I'm " + this.name + " and I ate " + item);
	}
};
*/

john.logFood();