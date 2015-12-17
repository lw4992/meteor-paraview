/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />

/**
 * It's much easier to control the size of #paraview-viewport indirectly by controlling the size of the container, #paraview-viewport-container
 */
var refreshIntervalId:number = null,
    templateInstance:Blaze.TemplateInstance,
    isInitializing = false,
    userStatusHandle = null;

var waitForEquals = function waitForEquals(currentValFunc:Function, desiredValue:any, callback:Function, timeoutInMillis = 10000) {
    var checkInterval = 100;
    var startTime = Date.now();
    var intervalId = Meteor.setInterval(function () {
        if (currentValFunc() === desiredValue) {
            Meteor.clearInterval(intervalId);
            callback();
        } else if (Date.now() > startTime + timeoutInMillis) {
            Meteor.clearInterval(intervalId);
            callback(new Meteor.Error('timeout', 'DAUtil.waitForEquals:  Function timed out waiting for function to return desired value'));
        }
    }, checkInterval);
};

var waitForTruthy = function waitForTruthy(checkFunc:Function, callback:Function, timeoutInMillis = 10000) {
    var currentValFunc = function () {
        return !!checkFunc();
    };
    waitForEquals(currentValFunc, true, callback, timeoutInMillis);
};

var proposeSharedSession = function proposeSharedSession(partnerId) {
    UserHelper.updateSharingState({
        userId: Meteor.user()._id,
        sharingStatus: UserHelper.SharedState.PROPOSING,
        partnerId: partnerId
    });
    UserHelper.updateSharingState({
        userId: partnerId,
        sharingStatus: UserHelper.SharedState.PROPOSED_TO,
        partnerId: Meteor.user()._id
    });
};

var isOnJoinedSimulationPage = function isOnJoinedSimulationPage() {
    var route = Router.current().route.getName();
    return route === 'joinedSimulation';
};

var listenForInitializedSharedState = function listenForInitializedSharedState() {
    templateInstance.autorun(() => {
        if (UserHelper.thisUserHasSharingState(UserHelper.SharedState.INITIALIZED)) {
            Session.set('hasJoinedParaviewSessionOf', null);
            Session.set('hasSharedParaviewSessionWith', null);
            Meteor.call('removePVUserCameraSettingsForThisUser');
            if (isOnJoinedSimulationPage()) {
                if (UserHelper.prevPage) {
                    Router.go(UserHelper.prevPage);
                } else {
                    Router.go('geothermalMap');
                }
            }
            UserHelper.prevPage = null;
        }
    });
};

var initialize = function initialize() {
    Session.set('hasJoinedParaviewSessionOf', null);
    Session.set('hasSharedParaviewSessionWith', null);
    listenForInitializedSharedState();
};

Template['paraviewSharedSessionControls'].onCreated(function () {
    userStatusHandle = Meteor.subscribe('userStatus');
    isInitializing = true;
});

Template['paraviewSharedSessionControls'].onRendered(function () {
    templateInstance = this; // set page-scoped var
    waitForTruthy(Meteor.user, initialize);
});

var thisUserCanShare = function thisUserCanShare() {
    var thisUser = Meteor.user();
    if (!thisUser || !thisUser['sharing'] || thisUser['sharing']['status'] !== UserHelper.SharedState.INITIALIZED) return false;
    return true;
};

var getShareableOtherUsers = function getShareableOtherUsers(): Mongo.Cursor<Meteor.User> {
    return Meteor.users.find({
        username: {$ne: Meteor.user().username},
        'status.online': true,
        'sharing.status': UserHelper.SharedState.INITIALIZED
    });
};

Template['paraviewSharedSessionControls'].helpers({
    canShare: function () {
        if (!thisUserCanShare()) return false;
        return getShareableOtherUsers().count() > 0;
    },
    otherUsers: function () {
        return getShareableOtherUsers();
    },
    isProposing: function () {
        return UserHelper.thisUserHasSharingState(UserHelper.SharedState.PROPOSING);
    },
    partnerUsername: function () {
        return UserHelper.getPartnerUsername();
    },
    partnerId: function () {
        return UserHelper.getPartnerId();
    },
    isJoined: function () {
        return UserHelper.thisUserHasSharingState(UserHelper.SharedState.JOINED);
    },
    isShared: function () {
        return UserHelper.thisUserHasSharingState(UserHelper.SharedState.SHARED);
    }
});

Template['paraviewSharedSessionControls'].events({
    'click [data-share-session-link]': function (event, template) {
        event.preventDefault();
        var userId = event.target.getAttribute('data-user-id');
        proposeSharedSession(userId);
    },
    'click [data-reset-sessions]': function (event, template) {
        event.preventDefault();
        var partnerId = event.target.getAttribute('data-partner-id'),
            thisUser = <ExtUser> Meteor.user();

        UserHelper.initializeSharingState(thisUser._id);
        UserHelper.initializeSharingState(partnerId);
    }
});

Template['paraviewSharedSessionControls'].onDestroyed(function () {
    Meteor.clearInterval(refreshIntervalId); // not sure this is necessary
});