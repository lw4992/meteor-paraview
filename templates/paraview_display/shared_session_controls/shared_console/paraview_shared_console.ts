/// <reference path='../../../.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../.typescript/custom_defs/all-custom-definitions.d.ts' />

Template['paraviewSharedConsole'].helpers({
    helperName: function () {
    }
});

Template['paraviewSharedConsole'].onCreated(function () {

});

Template['paraviewSharedConsole'].onRendered(function () {

});

Template['paraviewSharedConsole'].onDestroyed(function () {

});

Template['paraviewSharedConsole'].events({
    'click .something': function (event:Meteor.Event, template:Blaze.Template) {
    }
});

Template['paraviewLogEntry'].helpers({
    formatDate: function(timestamp: number) {
        return moment(timestamp).format('YYYY-MM-DD hh:mm:ss');
    }
});