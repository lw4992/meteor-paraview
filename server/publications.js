if (Meteor.isServer) {
    ParaviewSettings.allow({
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

    Meteor.publish('paraviewSettings', function () {
        return ParaviewSettings.find({});
    });
}