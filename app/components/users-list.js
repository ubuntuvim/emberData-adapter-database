import Ember from 'ember';

export default Ember.Component.extend({
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
