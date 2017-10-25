'use strict';

let publishLists = require('./lib/PublishAddLists.js'),
	publishHooks = require('./lib/PublishAddHooks.js'),
	async = require('async');

require('dotenv').config();	


class PublishHandler {
	
	constructor() {
		this.config = {};
		this.config.stgPrefix = 'Stg';
		this.publishAbleList = [];
		this.keystone = null;
	}
	
	init(settings) {
		// bring in Keystone in case it is not brought in on init.
		// It is best to always initialize with the project instance of keystone, though,
		// to avoid versioning conflicts
		if (!settings.keystone) {
			settings.keystone = require('keystone');
			console.log("Warning: 'keystone-publishable' is using its own instance of keystone. Please initialize with the current project's instance.")
		} 
		
		console.log("Init", settings)

		// establish project settings
		this.config = Object.assign({}, this.config, settings);
	}

	// uses `arguments` in addition to `model` to account for any middleware that is passed through
	add(model){

		if (!model.listName) return console.error('Error: "listName" must exist in the object.');

		this.publishAbleList.push(model.listName);

		let Lists = publishLists.setup(model, this.config);

		if (arguments.length === 1) {
			this.register(Lists.StageList, Lists.ProdList);
			return;
		}

		// if more arguments than model have been passed, we have middleware
		this.initMiddleware(Lists.StageList, Lists.ProdList, Array.prototype.slice.call(arguments, 1));
		
	}

	registerLists(StageList, ProdList) {

		// make sure the added publishing fields are displayed last
		publishLists.initPublishFields(StageList, this.config);
			
		// add publishing hooks
		publishHooks(StageList, this.config);

		StageList.register()
		ProdList.register();

	}

	initMiddleware(StageList, ProdList, args, done){

		let boundMiddlewareArr = args.map(function(fn){
			return fn.bind(this, StageList, ProdList);
		}.bind(this));

		async.series(boundMiddlewareArr, function (error, returns) {	
         	if (error) console.log('Error', error); 
         	else this.registerLists(StageList, ProdList)
      	}.bind(this));

	}

	get lists(){
		return this.publishAbleList;
	} 

	get stgPrefix(){
		return this.config.stgPrefix;
	}

	getList(list){
		if (process.env.NODE_ENV === 'production') return list;
		else return this.config.stgPrefix + list;
	}

	getConfig(){
		return this.config;
	}

	getKeystone(){
		return this.keystone;
	}



}

exports = module.exports = new PublishHandler();