import Ember from 'ember';

export default Ember.Component.extend({
	actions: {
		// 删除记录
		del(id) {
			console.log('删除记录：' + id);
			this.store.findRecord('user', id).then((u) => {
				
			    u.destroyRecord(); // => DELETE to /users/2
			    
			    
			    // u.save();
				// u.get('isDeleted'); // => true
				// => DELETE to /users/id
				// u.save().then(() => { 
					// this.transitionTo('users');
					// location.reload();
				// }); 
			});
		}
	}
});
