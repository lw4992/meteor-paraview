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

Meteor.publish('paraviewUsersOnline', () => {
    var users = Meteor.users.find({'status.online': true}, {fields: {_id: 1, username: 1}});
    //console.dir(users);
    return users;
});

Meteor.publish('paraviewUsersOffline', () => {
    var users = Meteor.users.find({'status.online': false}, {fields: {_id: 1, username: 1, status: 1}});
    //console.dir(users);
    return users;
});

Meteor.publish('paraviewUserStatus', () => {
    var users = Meteor.users.find({}, {fields: {_id: 1, username: 1, status: 1}});
    //console.dir(users);
    return users;
});

Meteor.publish("userStatus", function () {
    return Meteor.users.find({}, {fields: {_id: 1, username: 1, status: 1 }});
    //return Meteor.users.find({"status.online": true}, {fields: {_id: 1, username: 1, status: 1 }});
});


