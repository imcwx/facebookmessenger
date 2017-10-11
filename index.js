const FB_ACECSS_TOKEN = process.env.FB_ACECSS_TOKEN
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN
const APIAI_TOKEN = process.env.APIAI_TOKEN;


const express = require('express')
const bodyParser  = require('body-parser')
const request = require('request')
const apiai = require('apiai');


const urlTemplate = "https://www.google.com"
const urlPicture = "https://cdn.pixabay.com/photo/2017/05/05/22/28/kitten-2288404_960_720.jpg"


const app = express()
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.set('port',(process.env.PORT || 5000))

const apiaiApp = apiai(APIAI_TOKEN);

app.get('/', function (req, res){
	res.send('Hello Facebook!!')
})


app.get('/webhook',function(req, res){
	if(req.query['hub.verify_token'] === 
		FB_VERIFY_TOKEN){
		res.send(req.query['hub.challenge'])
	}
	res.send('No entry')
})


app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});
  

function receivedMessage(event) {
  var senderId = event.sender.id;
  var recipientId = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderId, recipientId, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;
  var messageText = message.text;
  var messageAttachments = message.attachments;


  var apiaiRequest = apiaiApp.textRequest(messageText, {
    sessionId: senderId+recipientId 
  });


  if (messageText) {

    apiaiRequest.on('response', (response) => {
    var aiText = response.result.fulfillment.speech;
    console.log(aiText);

    // If we receive a text message, check to see if it matches a keyword
    // and send back the example. Otherwise, just echo the text we received.
    switch (messageText) {
      case 'generic':
        sendGenericMessage(senderId);
        break;
      case 'image':
        sendImageMessage(senderId);
        break;
      case 'checkin':
        sendCheckin(senderId);
        break;
      case 'list':
        sendList(senderId);   // not working, need to implement url to whitelist?
        break;

      default:
        // sendTextMessage(senderID, messageText);
        sendTextMessage(senderId, aiText);
    }
  });
  } else if (messageAttachments) {
    sendTextMessage(senderId, "Message with attachment received");
  }

    apiaiRequest.on('error', (error) => {
    console.log(error);
  });

  apiaiRequest.end();
}


function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "https://c1.staticflickr.com/8/7160/13300603614_db998fefd0_b.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Oculus-Rift-Touch-Controllers-Pair.jpg/1280px-Oculus-Rift-Touch-Controllers-Pair.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  

  callSendAPI(messageData);
}


function sendImageMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: "https://cdn.pixabay.com/photo/2017/05/05/22/28/kitten-2288404_960_720.jpg"
        }
      }
    }
  };
  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}



function sendCheckin(recipientId){

  var messageData = {
    "recipient": {
      "id": recipientId
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "airline_checkin",
          "intro_message": "Check-in is available now.",
          "locale": "en_US",        
          "pnr_number": "ABCDEF",
          "checkin_url": "http://www.singaporeair.com/",  
          "flight_info": [
            {
              "flight_number": "f001",
              "departure_airport": {
                "airport_code": "SFO",
                "city": "San Francisco",
                "terminal": "T4",
                "gate": "G8"
              },
              "arrival_airport": {
                "airport_code": "SEA",
                "city": "Seattle",
                "terminal": "T4",
                "gate": "G8"
              },
              "flight_schedule": {
                "boarding_time": "2016-01-05T15:05",
                "departure_time": "2016-01-05T15:45",
                "arrival_time": "2016-01-05T17:30"
              }
            }
          ]
        }
      }
    }
  };
  callSendAPI(messageData);
}



function sendList(recipientId){

  var messageData = {
    "recipient":{
      "id":recipientId
    }, 
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "list",
          "top_element_style": "compact",
          "elements": [
            {
              "title": "Classic T-Shirt Collection",
              "subtitle": "See all our colors",
              "image_url": urlPicture,          
              "buttons": [
                {
                  "title": "View",
                  "type": "web_url",
                  "url": urlTemplate,
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall",
                  "fallback_url": urlTemplate           
                }
              ]
            },
            {
              "title": "Classic White T-Shirt",
              "subtitle": "See all our colors",
              "default_action": {
                "type": "web_url",
                "url": urlTemplate,
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": urlTemplate
              }
            },
            {
              "title": "Classic Blue T-Shirt",
              "image_url": urlPicture,
              "subtitle": "100% Cotton, 200% Comfortable",
              "default_action": {
                "type": "web_url",
                "url": urlTemplate,
                "messenger_extensions": true,
                "webview_height_ratio": "tall",
                "fallback_url": urlTemplate
              },
              "buttons": [
                {
                  "title": "Shop Now",
                  "type": "web_url",
                  "url": urlTemplate,
                  "messenger_extensions": true,
                  "webview_height_ratio": "tall",
                  "fallback_url": urlTemplate            
                }
              ]        
            }
          ],
           "buttons": [
            {
              "title": "View More",
              "type": "postback",
              "payload": "payload"            
            }
          ]  
        }
      }
    }
  };
  callSendAPI(messageData)
}






function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: FB_ACECSS_TOKEN },
    method: 'POST',
    json: messageData
    }, callback);  
}


function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  }



app.listen(app.get('port'),function(){
	console.log('running on port',app.get('port'))
})
