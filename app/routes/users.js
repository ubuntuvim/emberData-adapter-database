// app/routes/user.js
import Ember from 'ember';

export default Ember.Route.extend({
	// redirect: function(model, transition) {  
	//     this.transitionTo('users.list');
	// }
	model() {
		return this.store.findAll('user');
	}
});
