export function sendImageMessage(recipientId) {
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
