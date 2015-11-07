SimpleChat = {
    roomId: 'defaultRoomId',
    userId: null,
    maxMessagesDisplayed: 100
};

SimpleChat.configure = function configure(options = {roomId: 'defaultRoomId', userId: Meteor.user(), maxMessagesDisplayed: 100}) {
    this.roomId = options.roomId;
    this.userId = options.userId;
    this.maxMessagesDisplayed = options.maxMessagesDisplayed;
};

SimpleChat.send = function send(messageText: string) {
    this.userId = this.userId || Meteor.user() && Meteor.user().username || Random.id();
    var message = {
        roomId: this.roomId,
        userId: this.userId,
        messageText: messageText,
        timestamp: Date.now()
    };
    Meteor.call('insertSimpleChatMessage', message);
};

SimpleChat.removeAllMessages = function removeAllMessages(roomId) {
    roomId = roomId || this.roomId;
    Meteor.call('removeAllMessages', roomId);
};