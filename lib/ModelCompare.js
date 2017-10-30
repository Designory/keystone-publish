let _ = require('underscore');
let equal = require('deep-equal');

module.exports = function(prod, stage){

	prod = prod._doc || prod;
	stage = stage._doc || stage;

	if (!prod || !stage) return {isSame:false, diffFields:'Error: missing production or stage list record'};

	let isSame = true,
		diffArr = [],
		ignoreList = [
			'publishToProduction', 
			'produtionDifferences', 
			'matchesLive', 
			'existsOnLive', 
			'nameMatchesLive', 
			'collapse',
			'referencePage',
			'unpublishProduction'
		];

	for (key in stage){

		if (!stage.hasOwnProperty(key)) continue;

		if (ignoreList.indexOf(key) > -1) continue;;

		if (key != 'key' && key != '__v') {

			let stageValue = (typeof stage[key] == 'string') ? stage[key].trim() : stage[key];
			let prodValue = (typeof prod[key] == 'string') ? prod[key].trim() : prod[key];

			if (!equal(stageValue, prodValue)) {
				isSame = false;
				diffArr.push(key);
			}
		}
	}

	return {
		isSame:isSame, 
		produtionDifferences:diffArr.join(', ')
	}	
}