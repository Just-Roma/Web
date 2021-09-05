onmessage = function(message) {
  console.log('Message received from main script');
  var workerResult = 'Result: ' + (message.data[0] * message.data[1]);
  console.log('Posting message back to main script');
  postMessage(workerResult);
}
