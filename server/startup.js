Meteor.startup(function() {
    console.log('Removing ParaviewSessions, only on server');
    ParaviewSessions.remove({});
});