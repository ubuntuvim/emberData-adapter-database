// import JSONAPISerializer from 'ember-data/serializers/json-api';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
	extractDeleteRecord: function(store, type, payload) {
	  // If the payload is {delete: true}, Ember Data will try to set
	  // the new properties. Return null so it doesn't try to do that.
	  return null;
	},
	createPageMeta(data) {

	    let meta = {};

	    Object.keys(data).forEach(type => {
	      const link = data[type];
	      meta[type] = {};
	      let a = document.createElement('a');
	      a.href = link;

	      a.search.slice(1).split('&').forEach(pairs => {
	        const [param, value] = pairs.split('=');

	        if (param == 'page%5Bnumber%5D') {
	          meta[type].number = parseInt(value);
	        }
	        if (param == 'page%5Bsize%5D') {
	          meta[type].size = parseInt(value);
	        }

	      });
	      a = null;
	    });

	    return meta;

	  }
});
