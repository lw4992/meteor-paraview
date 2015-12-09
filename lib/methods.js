Meteor.methods({
    "upsertPVUserCameraSettings": function(paraviewCameraSettings) {
        PVUserCameraSettings.upsert({ userId: paraviewCameraSettings.userId }, paraviewCameraSettings);
    },
    'insertSimpleChatMessage': function(message) {
        SimpleChatMessages.insert(message);
    },
    'removeAllMessages': function(roomId) {
        SimpleChatMessages.remove({roomId: roomId});
    }
});
