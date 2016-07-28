// app/adapters/application.js

// import JSONAPIAdapter from 'ember-data/adapters/json-api';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
// export default JSONAPIAdapter.extend({
	namespace: 'api/v1',
	host: 'http://localhost:4200'
});
