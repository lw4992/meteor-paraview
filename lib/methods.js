Meteor.methods({
    'upsertPVUserCameraSettings': function(paraviewCameraSettings) {
        PVUserCameraSettings.upsert(
            { userId: paraviewCameraSettings.userId },
            paraviewCameraSettings,
            { multi: false },
            error => {
                if (error) throw new Meteor.Error('bad-upsert-camera-settings', 'There was an error trying to upsert camera settings');
            }
        );
        return 'Success';
    },
    'removePVUserCameraSettingsForThisUser': function() {
        var thisUser = Meteor.user();
        if (!thisUser) return;
        PVUserCameraSettings.remove({ userId: thisUser._id });
    },
    'insertSimpleChatMessage': function(message) {
        SimpleChatMessages.insert(message);
    },
    'removeAllMessages': function(roomId) {
        SimpleChatMessages.remove({roomId: roomId});
    }
});
