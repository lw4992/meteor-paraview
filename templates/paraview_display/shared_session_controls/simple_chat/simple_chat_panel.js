/// <reference path='../../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
var waitForEquals = function waitForEquals(currentValFunc, desiredValue, callback, timeoutInMillis) {
    if (timeoutInMillis === void 0) { timeoutInMillis = 10000; }
    var checkInterval = 100;
    var startTime = Date.now();
    var intervalId = Meteor.setInterval(function () {
        if (currentValFunc() === desiredValue) {
            Meteor.clearInterval(intervalId);
            callback();
        }
        else if (Date.now() > startTime + timeoutInMillis) {
            Meteor.clearInterval(intervalId);
            callback(new Meteor.Error('timeout', 'DAUtil.waitForEquals:  Function timed out waiting for function to return desired value'));
        }
    }, checkInterval);
};
var waitForHTMLElement = function waitForHTMLElement(selector, callback, timeoutInMillis) {
    if (timeoutInMillis === void 0) { timeoutInMillis = 10000; }
    waitForEquals(function () { return !!$(selector); }, true, callback, timeoutInMillis);
};
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
Template['simpleChatPanel'].onRendered(function () {
    var _this = this;
    var messages = null;
    Meteor.setTimeout(function () { return scrollMessagesDisplay(_this); }, 1000);
    this.autorun(function () {
        messages = SimpleChatMessages.find({ roomId: SimpleChat.roomId });
        messages.count(); // have to actually do something with messages to trigger autorun
        scrollMessagesDisplay(_this);
    });
    waitForHTMLElement('#simple-chat .panel-heading', SimpleChat.resizeToContainer);
});
Template['simpleChatPanel'].events({
    'submit #simple-chat-form': function (event, templateInstance) {
        event.preventDefault();
        var messageText = templateInstance.$('#simple-chat-text-box').val();
        if (messageText)
            SimpleChat.send(messageText);
        templateInstance.$('#simple-chat-text-box').val('');
    }
});
Template['simpleChatMessage'].helpers({
    formatDate: function (timestamp) {
        var messageMoment = moment(timestamp);
        if (messageMoment < moment().subtract(1, 'days')) {
            return messageMoment.toNow(true) + ' ago, ' + messageMoment.format('h:mm a');
        }
        return messageMoment.format('h:mm a');
    }
});
//# sourceMappingURL=simple_chat_panel.js.map