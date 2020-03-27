'use strict';

let publishLists = require('./lib/PublishAddLists.js'),
	publishHooks = require('./lib/PublishAddHooks.js'),
	async = require('async');

require('dotenv').config();	

class PublishHandler {
	
	constructor() {
		this.config = {};
		this.config.stgPrefix = 'Stg';
		this.config.languages = [];
		this.config.prodPreviewParam = null;
		this.allLists = [];
		this.nonPublishables = [];
		this.uiNav = {};
		this.parentChild = [];
	}
	
	init(settings) {
		// It is best to always initialize with the project instance of keystone, though,
		// to avoid versioning conflicts
		if (!settings.keystone) {
			return console.log("Error: 'keystone-publishable' Needs to be initialized with the project's keystone instance.")
		} 
		
		// establish project settings
		this.config = Object.assign({}, this.config, settings);
	}

	// uses `arguments` in addition to `model` to account for any middleware that is passed through
	register(model){

		let self = this;

		if (!model.listName) return console.error('Error: "listName" must exist in the object.');

		this.allLists.push(model.listName);

		if (model.nonPublishable) this.nonPublishables.push(model.listName);

		let Lists = publishLists.setup(model, this.config);

		this.addToUiNav(Lists.StageList || Lists.ProdList);

		if (arguments.length === 1) {
			this.registerLists(Lists.StageList, Lists.ProdList);
			return;
		}

		// if more arguments than model have been passed, we have middleware
		this.initMiddleware(Lists.StageList, Lists.ProdList, Array.prototype.slice.call(arguments, 1));
		
	}

	registerLists(StageList, ProdList) {

		// make sure the added publishing fields are displayed last
		if (StageList) publishLists.initPublishFields(StageList, this.config);
				
		// add publishing hooks
		if (StageList) publishHooks(StageList, this.config, this.config.keystone);

		if (this.config.preRegisterHooks) {
			this.config.preRegisterHooks(StageList, ProdList);
		}

		if (StageList) StageList.register();
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

	addToUiNav(List){
		
		if (!this.uiNav[List.category]) {
			this.uiNav[List.category] = [List.path]
		} else {
			this.uiNav[List.category].push(List.path)
		} 	
	
	}

	getUiNav(category){
		if (category) {
			return this.uiNav[category];
		} 
		else return this.uiNav;
	}

	get lists(){
		return this.allLists;
	} 

	get stgPrefix(){
		return this.config.stgPrefix;
	}

	getList(list, req){
		
		let returnStr = '';

		// first we need to determine whether we are in prod editing (or prod-based preview) mode
		// the default is to assume a seperate editing environment
		if (!this.config.prodPreviewParam) {
			// if we are in the production environment, we return the production list
			if (process.env.NODE_ENV === 'production') returnStr = list;
			else if (this.nonPublishables.indexOf(list) != -1) returnStr = list;
			else returnStr = this.config.stgPrefix + list;

		} else {

			// if (!req) {
			// 	console.log("Error: When operating in prod preview mode, the 'getList' method need to recieve the req object: 'getList([listname], req)'");
			// 	req = {};
			// }

			// if we are in the production environment, we return the production list
			if (this.nonPublishables.indexOf(list) != -1 || req && req.query && req.query[this.config.prodPreviewParam] === 'true') returnStr = this.config.stgPrefix + list;
			else returnStr = list;
		}


		// we need to account for the particular language that us being requested
		if (this.config.languages.length) {
			// add language prefix to the list name
			/* 
			
			this.config.languages.filter 

			*/
		}

		return returnStr;

	}

	getLanguage(req){
		return this.config.languages.filter(function(item){
			return item === req.path;
		})[0] || 'en';
	}

	getConfig(){
		return this.config;
	}

	getKeystone(){
		return this.keystone;
	}

}

exports = module.exports = new PublishHandler();