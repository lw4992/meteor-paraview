ParaviewSessions.allow({
    insert: function (userId, doc) {
        return true;
    },
    update: function (userId, doc, fields, modifier) {
        return true;
    },
    remove: function (userId, doc) {
        return true;
    }
});

Meteor.publish('paraviewSettings', () => ParaviewSessions.find({}, {sort: {timestamp: -1}}));

Meteor.publish('usersOnline', () => {
    var users = Meteor.users.find({'status.online': true}, {fields: {_id: 1, username: 1}});
    return users;
});

Meteor.publish('usersOffline', () => {
    var users = Meteor.users.find({'status.online': false}, {fields: {_id: 1, username: 1, status: 1}});
    return users;
});

Meteor.publish("userStatus", function () {
    return Meteor.users.find({}, {fields: {_id: 1, username: 1, status: 1 }});
});

Meteor.publish('simpleChatMessages', function() {
    return SimpleChatMessages.find({});
});

