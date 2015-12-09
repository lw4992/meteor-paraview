Meteor.publish('usersOnline', () => {
    var users = Meteor.users.find({'status.online': true}, {fields: {_id: 1, username: 1}});
    return users;
});

Meteor.publish('usersOffline', () => {
    var users = Meteor.users.find({'status.online': false}, {fields: {_id: 1, username: 1, status: 1}});
    return users;
});

//Meteor.publish("userStatus", function () {
//    return Meteor.users.find({}, { fields: { _id: 1, username: 1, status: 1, 'sharing.status': 1 , 'sharing.partnerId': 1, 'sharing.jobId': 1, 'sharing.formDefId': 1, 'sharing.visDefId': 1 } });
//});

Meteor.publish('simpleChatMessages', function() {
    return SimpleChatMessages.find({});
});

Meteor.publish('allPVUserCameraSettings', function() {
    return PVUserCameraSettings.find({});
});