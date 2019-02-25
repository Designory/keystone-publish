const _ = require('underscore'),
	ModelCompare = require('./ModelCompare'),
	traverse = require('traverse');

module.exports = function(list, config, keystone){

	(function(list, config, keystone){

		let stgType = list.key,
		prodType = stgType.replace(config.stgPrefix, '');

		debugger;

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
								prodPublish(doc);
								console.log(`${prodType} (production) updated - ${doc._id}`);
							});

		                } else {

		                	let NewItem = keystone.list(prodType).model(doc._doc);
							NewItem.save(function (err){
								if(err) throw(err);
								prodPublish(item);
								console.log(`${prodType} (production) created.`);
							});

		                }
		            });

			} else if (doc.unpublishProduction) {

				console.log('} else if (doc.unpublishProduction) {');

				removeProdList(doc);
				doc.matchesLive = false;
				doc.produtionDifferences = '';
				doc.publishToProduction = false;
				doc.unpublishProduction = true;
				doc.existsOnLive = false;

				next();

			} else {
				noProdPublish();
				console.log(`${stgType} (staging) was saved. ${prodType} (production) was NOT updated.`);	
			}

			function prodPublish(item){

				doc.matchesLive = true;
		        doc.produtionDifferences = '';
		        doc.publishToProduction = false;
		        doc.unpublishProduction = false;
		        doc.existsOnLive = true;

		        next();

			}

			function noProdPublish(){

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

		                	doc.matchesLive = false;
					        doc.produtionDifferences= '';
					        doc.publishToProduction = false;
					        doc.unpublishProduction = false;
					        doc.existsOnLive = false;

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

			console.log('removing!!! ', doc.name);

			let query = keystone.list(prodType).model
				.findOne()
                .where('_id', doc._id);

            query.exec(function(err, result) {
            	if (err) console.log(err);
            	if (result) result.remove();
            });
		}

	})(list, config, keystone);

}