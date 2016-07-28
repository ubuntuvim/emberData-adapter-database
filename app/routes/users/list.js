// app/routes/users/list.js
import Ember from 'ember';

// 显示所有用户
export default Ember.Route.extend({
	model() {
		return this.store.findAll('user');
	}
});
