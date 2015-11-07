Meteor.methods({
    'removeParaviewSessionsForUsername': function (username, callback) {
        ParaviewSessions.remove({username: username}, callback);
    },
    'upsertParaviewSession': function (sessionInfo) {
        ParaviewSessions.upsert({username: sessionInfo.username}, sessionInfo);
    },
    'insertSimpleChatMessage': function(message) {
        SimpleChatMessages.insert(message);
    },
    'removeAllMessages': function(roomId) {
        SimpleChatMessages.remove({roomId: roomId});
    }
});
