var apiai = require('apiai');
 
var app = apiai("20820e581e0e4fc79952de3e3a4da3fd");
 
var request = app.textRequest('get me a hotel', {
    sessionId: '<unique session id>'
});
 
request.on('response', function(response) {
    console.log(response);
});
 
request.on('error', function(error) {
    console.log(error);
});
 
request.end();