import Ember from 'ember';

export default Ember.Component.extend({
	tipInfo: null,

	actions: {
		saveOrUpdate(id, user) {
			if (id) {  //更新
				let username = this.get('model.username');
				let email = this.get('model.email');
				if (username && email) {
					this.store.findRecord('user', id).then((u) => {
						
						u.set('username', username);
						u.set('email', email);

						u.save().then(() => {
							this.set('tipInfo', "更新成功");
							// this.set('model.username', '');
							// this.set('model.email', '');
						});	
					});
				} else {
					this.set('tipInfo', "请输入username和email！");
				}

			} else {  //新增

				let username = this.get('model.username');
				let email = this.get('model.email');
				if (username && email) {
					this.get('store').createRecord('user', {
						username: username,
						email: email
					}).save().then(() => {
						this.set('tipInfo', "保存成功");
						this.set('model.username', '');
						this.set('model.email', '');
					}, (err) => {
						this.set('tipInfo', "保存失败"+err);
					});	
				} else {
					this.set('tipInfo', "请输入username和email！");
				}
		
			}
		}
	}
});
