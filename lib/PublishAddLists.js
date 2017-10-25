'use strict';

let keystone = require('keystone'),
	Types = keystone.Field.Types,
	traverse = require('traverse');

exports = module.exports = {

	setup: function(list, config){

		console.log(config);

		// by default, the production list will be hidden from the admin ui
		list.initialConfig.hidden = true;
		let ProdList = new config.keystone.List(list.listName, list.initialConfig);

		// add the production models the the prod list
		list.fieldConfig.forEach(function(item){
			ProdList.add(item);
		});

		// by default, the staging list will NOT be hidden from the admin ui
		list.initialConfig.hidden = false;
		// set the label to exclud
		list.initialConfig.label = list.listName;
		let StageList = new config.keystone.List(config.stgPrefix + list.listName, list.initialConfig);

		// might need to add confiration for this in the future,
		// but we need to re-map all mongoose relationtional fields
		// from prod to stage
		traverse(list.fieldConfig).forEach(function (val) {
    		if (this.key === 'ref') this.update(config.stgPrefix + val);
		});

		return {
			ProdList:ProdList,
			StageList:StageList
		}
	},

	initPublishFields: function(StageList, config){
		
		let Types = config.keystone.Field.Types

		StageList.add(
			{
				heading: "Publishing Information"
			},
			{ 
				existsOnLive:{
					type: Types.Boolean,
					default:false,
					noedit: true
				},
				matchesLive:{
					type: Types.Boolean,
					default:true,
					noedit: true
				},
				produtionDifferences:{
					type: Types.Textarea,
					crop:false,
					default:'',
					noedit: true,
					label:'Differences on Live',
					dependsOn: {existsOnLive:true}
				},
				publishToProduction:{
					type: Types.Boolean,
					default:false,
					label:'Publish to Live'
				},
				unpublishProduction:{
					type: Types.Boolean,
					default:false,
					label:'Remove from Live',
					dependsOn: {publishToProduction: true}
				}
			}
		);
	}
}
