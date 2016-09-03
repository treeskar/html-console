'use strict';
import './index.scss';
import 'imports?global=window!./html-console';
import { PubSub } from './pub-sub';

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
	window.console.log("i'm", this.name, "and i'm eating", foods.join(","));
	this.foods.length = 0;
	this.foods = foods;
	this.eventManager.trigger('eat:done', this);
};

Person.prototype.finishEat = function(time) {
	window.console.log("i'm", this.name, "and i finished eating at", time);
	this.eventManager.off("breakfast:ready", this.finishEat);
};

// logFood method has a task ahead
Person.prototype.logFood = function() {
	this.foods.forEach(function(item){
		window.console.log("I'm " + this.name + " and I ate " + item);
	}, this);
};

Person.prototype.logFood = function() {
	this.foods.forEach(function(item){
		window.console.log("I'm " + this.name + " and I ate " + item);
	}, this);
};


/*
	NOTICE: After you add your code of EventsManager you should run all the code and test your success with the code below.
	Meaning, the code below should work without any errors
*/

// start the app
MyEventsManager.on('eat:done', function(person){
	window.console.log(person.name, "finished eating");
});
MyEventsManager.on('breakfast:ready', function(menu){
	window.console.log("breakfast is ready with:", menu);
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
		window.console.log(msg);
	}, this);
};
/*
// Second solution
Person.prototype.logFood = function() {
	var name = this.name;
	this.foods.forEach(function(item){
		window.console.log("I'm " + name + " and I ate " + item);
	});
};

// but there are many solutions to fix it
Person.prototype.logFood = function() {
	this.foods.forEach((item) => {
		window.console.log("I'm " + this.name + " and I ate " + item);
	});
};

Person.prototype.logFood = function() {
	this.foods.forEach(printLog.bind(this));
	function printLog(item) {
		window.console.log("I'm " + this.name + " and I ate " + item);
	}
};
*/

john.logFood();

setTimeout(() => {
	throw new Error('My Error');
}, 3000);
