// Log connect/disconnect, relay events

const Logger = {
    // Ghi log khi có client kết nối
    logConnect: (clientType, clientId) => {
      console.log(`[CONNECT] ${clientType} connected. ID: ${clientId}`);
    },
  
    // Ghi log khi client ngắt kết nối
    logDisconnect: (clientType, clientId) => {
      console.log(`[DISCONNECT] ${clientType} disconnected. ID: ${clientId}`);
    },
  
    // Ghi log khi nhận message
    logReceivedMessage: (fromType, fromId, message) => {
      console.log(`[RECEIVE] Message from ${fromType} (ID: ${fromId}): ${JSON.stringify(message)}`);
    },
  
    // Ghi log khi gửi message
    logSendMessage: (toType, toId, message) => {
      console.log(`[SEND] Message to ${toType} (ID: ${toId}): ${JSON.stringify(message)}`);
    }
  };
  
  module.exports = Logger;