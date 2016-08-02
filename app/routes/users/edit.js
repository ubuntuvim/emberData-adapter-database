// app/routes/users/edit.js
import Ember from 'ember';

export default Ember.Route.extend({
	// 根据id获取某个记录
	model(params) {
		return this.store.findRecord('user', params.user_id);
	}
});
