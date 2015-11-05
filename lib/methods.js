Meteor.methods({
    'removeParaviewSessionsForUsername': function (username, callback) {
        ParaviewSessions.remove({username: username}, callback);
    },
    'upsertParaviewSession': function (sessionInfo) {
        ParaviewSessions.upsert({username: sessionInfo.username}, sessionInfo);
    }
});
