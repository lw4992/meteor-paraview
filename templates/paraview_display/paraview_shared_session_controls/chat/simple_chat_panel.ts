/// <reference path='../../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />

Template['simpleChatPanel'].helpers({
    simpleChatMessages: function () {
        var messages = SimpleChatMessages.find({ roomId: SimpleChat.roomId });
        return messages;
    }
});

var scrollMessagesDisplay = function scrollMessagesDisplay(templateInstance) {
    var $simpleChatMessages = templateInstance.$('#simple-chat .panel-body');
    $simpleChatMessages && $simpleChatMessages.scrollTop(100000); // scroll to very bottom
};

Template['simpleChatPanel'].onCreated(function () {
    SimpleChat.userId = SimpleChat.userId || Meteor.user() && Meteor.user().username || Random.id();
    Meteor.subscribe('simpleChatMessages');
});

var resizePanel = function resizePanel(templateInstance) {
    var panelTotalHeight = templateInstance.$('#simple-chat').height();
    var panelHeadingHeight = templateInstance.$('#simple-chat .panel-heading').outerHeight();
    var panelFooterHeight = templateInstance.$('#simple-chat .panel-footer').outerHeight();

    var panelBodyHeight = panelTotalHeight - panelHeadingHeight - panelFooterHeight;
    console.log('setting panelBodyHeight = ' + panelBodyHeight);
    templateInstance.$('#simple-chat .panel-body').outerHeight(panelBodyHeight);
};

Template['simpleChatPanel'].onRendered(function () {
    var messages = null;
    //this.$('#simple-chat').draggable();
    Meteor.setTimeout(() => scrollMessagesDisplay(this), 1000);
    this.autorun(() => {
        messages = SimpleChatMessages.find({ roomId: SimpleChat.roomId });
        messages.count(); // have to actually do something with messages to trigger autorun
        scrollMessagesDisplay(this);
    });

    resizePanel(this);
});

Template['simpleChatPanel'].onDestroyed(function () {

});

Template['simpleChatPanel'].events({
    'submit #simple-chat-form': function (event:Meteor.Event, templateInstance:Blaze.TemplateInstance) {
        event.preventDefault();
        var messageText = templateInstance.$('#simple-chat-text-box').val();
        if (messageText) SimpleChat.send(messageText);
        templateInstance.$('#simple-chat-text-box').val('');
    }
});

Template['simpleChatMessage'].helpers({
    formatDate: function(timestamp: number) {
        var messageMoment = moment(timestamp);
        if (messageMoment < moment().subtract(1, 'days')) {
            return messageMoment.toNow(true) + ' ago, ' + messageMoment.format('h:mm a');
        }
        return messageMoment.format('h:mm a');
    }
});