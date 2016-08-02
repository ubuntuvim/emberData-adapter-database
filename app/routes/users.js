// app/routes/user.js
import Ember from 'ember';
import RouteMixin from 'ember-cli-pagination/remote/route-mixin';

export default Ember.Route.extend(RouteMixin, {
	// redirect: function(model, transition) {  
	//     this.transitionTo('users.list');
	// }
	model(params) {
		return this.findPaged('user',params);
	}

	// queryParams: {
	// 	page: {
	// 	  refreshModel: true
	// 	},
	// 	size: {
	// 	  refreshModel: true
	// 	}
	// },
	actions: {
		// 删除记录
		del(id) {
			console.log('删除记录：' + id);
			this.get('store').findRecord('user', id).then((u) => {
			    u.destroyRecord(); // => DELETE to /users/2
			});
		}
	}
});
