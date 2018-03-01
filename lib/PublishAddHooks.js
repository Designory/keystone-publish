const _ = require('underscore'),
	ModelCompare = require('./ModelCompare'),
	traverse = require('traverse');

module.exports = function(list, config, keystone){

	(function(list, config, keystone){

		let stgType = list.key,
		prodType = stgType.replace(config.stgPrefix, '');

		list.schema.pre('save', function(next) {	
			
			let doc = this;

			if (doc.publishToProduction) {

				keystone
					.list(prodType)
					.model.findOne()
					.where('_id', doc._id)
	            	.exec(function(err, item) {

	            		if (err) { 
	            			console.log(`No update made. Error accessing ${prodType} item: ${err}`);
	            			next();
	            		}

		                if (item) {

		                	item.update(doc._doc, function (err){
								if(err) throw(err);
								console.log(`${prodType} (production) updated - ${doc._id}`);
								prodPublishCheck(doc);
							});

		                } else {

		                	let NewItem = keystone.list(prodType).model(doc._doc);
							NewItem.save(function (err){
								if(err) throw(err);
								console.log(`${prodType} (production) created.`);
								prodPublishCheck(item);
							});

		                }
		            });

			} else if (doc.unpublishProduction) {

				removeProdList(doc);
				doc.matchesLive = false;
				doc.produtionDifferences= false;
				doc.publishToProduction = false;
				doc.unpublishProduction = false;
				doc.existsOnLive = false;

			} else {
				console.log(`${stgType} (staging) was saved. ${prodType} (production) was NOT updated.`);
				noProdPublishCheck();
			}

			if(doc.publishParent) {

				keystone
					.list(doc.parentList)
					.model.findOne()
						.exec(function(err,item) {
							if(err) throw(err);
							console.log(`${doc.parentList} (production) updated`);
						});
			}

			function prodPublishCheck(item){
				
				if (item) {

	            	let comparison = ModelCompare(item, doc);
					doc.matchesLive = comparison.isSame;
					doc.produtionDifferences = comparison.produtionDifferences;
			        doc.publishToProduction = false;
			        doc.unpublishProduction = false;
			        doc.existsOnLive = true;

			        next();
	            
	            } else {

					doc.matchesLive = true;
			        doc.produtionDifferences = true;
			        doc.publishToProduction = false;
			        doc.unpublishProduction = false;
			        doc.existsOnLive = true;

			        next();	
	          	
	            }
			}

			function noProdPublishCheck(){

				keystone
					.list(prodType)
					.model.findOne()
					.where('_id', doc._id)
	            	.exec(function(err, item) {

	            		if (err) { 
	            			console.log(`No update made. Error accessing ${prodType} item: ${err}`);
	            			next();
	            		}

		                if (item) {

		                	let comparison = ModelCompare(item, doc);
							doc.matchesLive = comparison.isSame;
					        doc.produtionDifferences = comparison.produtionDifferences;
					        doc.publishToProduction = false;
					        doc.unpublishProduction = false;
					        doc.existsOnLive = true;
					        
					        next();
		                
		                } else {

		                	doc._doc.matchesLive = false;
					        doc._doc.produtionDifferences= false;
					        doc._doc.publishToProduction = false;
					        doc.unpublishProduction = false;
					        doc._doc.existsOnLive = false;

					        next();

		                }
		            });

			}

		});

		list.schema.post('remove', function(doc) {
			removeProdList(doc);
		});

		// list.schema.pre('init', function(next, data) {
		// 	console.log('data');
		//   	next();
		// });

		function removeProdList(doc){

			console.log('removing!!!', doc.name);

			let query = keystone.list(prodType).model
				.findOne()
                .where('_id', doc._id);
                    
            query.exec(function(err, result) {
            	if (result) result.remove();
            });
		}

	})(list, config, keystone);

}