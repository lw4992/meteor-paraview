/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
var SharedStateVals;
(function (SharedStateVals) {
    SharedStateVals[SharedStateVals["INITIALIZED"] = 0] = "INITIALIZED"; /* 0 */
    SharedStateVals[SharedStateVals["PROPOSING"] = 1] = "PROPOSING"; /* 1 */
    SharedStateVals[SharedStateVals["PROPOSED_TO"] = 2] = "PROPOSED_TO"; /* 2 */
    SharedStateVals[SharedStateVals["SHARED"] = 3] = "SHARED"; /* 3 */
    SharedStateVals[SharedStateVals["JOINED"] = 4] = "JOINED"; /* 4 */
    SharedStateVals[SharedStateVals["STOPPED"] = 5] = "STOPPED"; /* 5 */
})(SharedStateVals || (SharedStateVals = {}));
;
/**
 * It's much easier to control the size of #paraview-viewport indirectly by controlling the size of the container, #paraview-viewport-container
 */
var refreshIntervalId = null, templateInstance, isInitializing = false, 
//paraviewSettingsHandle = null,
userStatusHandle = null;
//originalParaviewSessionId:number = null;
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
var waitForTruthy = function waitForTruthy(checkFunc, callback, timeoutInMillis) {
    if (timeoutInMillis === void 0) { timeoutInMillis = 10000; }
    var currentValFunc = function () {
        return !!checkFunc();
    };
    waitForEquals(currentValFunc, true, callback, timeoutInMillis);
};
//var setViewportToSmallest = function setViewportToSmallest(partnerParaviewSession:ParaviewSessionsDAO) {
//    var currentWidth = $('#paraview-viewport-container').innerWidth();
//    var currentHeight = $('#paraview-viewport-container').innerHeight();
//    if (currentWidth > partnerParaviewSession.viewportWidth) $('#paraview-viewport-container').innerWidth(partnerParaviewSession.viewportWidth);
//    if (currentHeight > partnerParaviewSession.viewportHeight) $('#paraview-viewport-container').innerHeight(partnerParaviewSession.viewportHeight);
//    Meteor.setTimeout(function () {
//        PV.render();  // PV.render() uses dimensions of #paraview-viewport by default
//        PV.resetViewport();
//        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
//        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
//    }, 300);
//};
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
//var startSharingSession = function startSharingSession(proposerUsername) {
//    var thisUserSession = getInitializedParaviewSessionInfo();
//    thisUserSession.sharedState = SharedStateVals[SharedStateVals.JOINED];
//    thisUserSession.partnerUsername = proposerUsername;
//    thisUserSession.jobId = Session.get('currentJobId');
//    Meteor.call('upsertParaviewSession', thisUserSession);
//    Session.set('hasJoinedParaviewSessionOf', proposerUsername);
//
//    var partnerUserSession: ParaviewSessionsDAO = <ParaviewSessionsDAO> ParaviewSessions.findOne({ username: proposerUsername });
//    partnerUserSession.sharedState = SharedStateVals[SharedStateVals.SHARED];
//    partnerUserSession.partnerUsername = Meteor.user().username;
//    Meteor.call('upsertParaviewSession', partnerUserSession);
//
//    console.log('partnerUserSession._id = ' + partnerUserSession._id);
//
//    originalParaviewSessionId = PV.getSessionId();
//    PV.setSessionId(partnerUserSession.session._id);
//    PV.rebindViewport();
//
//    setViewportToSmallest(partnerUserSession);
//
//    initializeSimpleChat();
//
//    refreshIntervalId = Meteor.setInterval(function () {
//        PV.render();    // PV.render() uses dimensions of #paraview-viewport by default
//    }, 100);
//};
//var getSessionFromSharedState = function getSessionFromSharedState(sharedState: string) {
//    var paraviewSession = ParaviewSessions.findOne({
//        username: Meteor.user().username,
//        //page: window.location.pathname,
//        sharedState: sharedState
//    }, {sort: {timestamp: 'desc'}});
//    return paraviewSession;
//};
//var getSessionFromUserSharedState = function getSessionFromUserSharedState(username: string, sharedState: string) {
//    var paraviewSession = ParaviewSessions.findOne({
//        username: username,
//        sharedState: sharedState
//    }, {sort: {timestamp: 'desc'}});
//    return paraviewSession;
//};
//var userHasSharedState = function userHasSharedState(username: string, sharedState:string) {
//    return !!getSessionFromUserSharedState(username, sharedState);
//};
//var hasSharedState = function hasSharedState(sharedState:string) {
//    return !!getSessionFromSharedState(sharedState);
//};
//var getPartnerUsername = function getPartnerUsername() {
//    var paraviewSessions = ParaviewSessions.findOne({
//        username: Meteor.user().username,
//        //page: window.location.pathname
//    }, {sort: {timestamp: 'desc'}});
//    if (paraviewSessions) return paraviewSessions.partnerUsername;
//};
var initializeSimpleChat = function initializeSimpleChat() {
    SimpleChat.configure({
        roomId: 'paraviewSimpleChat',
        userId: Meteor.user().username
    });
    SimpleChat.removeAllMessages();
};
// This client is in proposed state and other user accepts/starts sharing
//var listenForSharedSession = function listenForSharedSession() {
//    var thisUserSession = null,
//        partnerSession = null;
//
//    templateInstance.autorun(function () {
//        thisUserSession = getSessionFromSharedState(SharedStateVals[SharedStateVals.SHARED]);
//        //console.log('thisUserSession = ' + JSON.stringify(thisUserSession));
//        if (thisUserSession) {
//            //console.log('about to set refresh interval');
//            refreshIntervalId = Meteor.setInterval(function () {
//                //console.log('rendering for proposer');
//                PV.render();    // PV.render() uses dimensions of #paraview-viewport by default
//
//            }, 100);
//            partnerSession = ParaviewSessions.findOne({ username: thisUserSession.partnerUsername });
//            setViewportToSmallest(partnerSession);
//            initializeSimpleChat();
//            Session.set('hasSharedParaviewSessionWith', thisUserSession.partnerUsername);
//        } else {
////            console.log('clearing interval in listener');
//            Meteor.clearInterval(refreshIntervalId);
//        }
//    });
//};
// This client is not sharing and other user proposes sharing
//var listenForProposedSharing = function () {
//    templateInstance.autorun(function () {
//        if (hasSharedState(SharedStateVals[SharedStateVals.PROPOSED_TO])) {
//            Session.set('isProposedToJoin', true);
//            //templateInstance.$('#proposed-to-modal').modal('show');
//        }
//    });
//};
var isOnJoinedSimulationPage = function isOnJoinedSimulationPage() {
    var route = Router.current().route.getName();
    return route === 'joinedSimulation';
};
var listenForInitializedSharedState = function listenForInitializedSharedState() {
    templateInstance.autorun(function () {
        if (UserHelper.thisUserHasSharingState(UserHelper.SharedState.INITIALIZED)) {
            Session.set('hasJoinedParaviewSessionOf', null);
            Session.set('hasSharedParaviewSessionWith', null);
            if (isOnJoinedSimulationPage()) {
                if (UserHelper.prevPage) {
                    Router.go(UserHelper.prevPage);
                }
                else {
                    Router.go('geothermalMap');
                }
            }
            UserHelper.prevPage = null;
        }
    });
    //templateInstance.autorun(function() {
    //    if (hasSharedState(SharedStateVals[SharedStateVals.INITIALIZED])) {
    //        //console.log('Initializing!!!');
    //        Session.set('hasJoinedParaviewSessionOf', null);
    //        Session.set('hasSharedParaviewSessionWith', null);
    //        templateInstance.$('#proposed-to-modal').modal('hide');
    //        //initializeParaviewViewport();
    //        if (isOnJoinedSimulationPage()) {
    //            window.location.pathname = UserHelper.prevPage || '/geothermalmap';
    //        }
    //        UserHelper.prevPage = null;
    //    }
    //});
};
//var getInitializedParaviewSessionInfo = function getInitializedParaviewSessionInfo(): ParaviewSessionsDAO {
//    return {
//        username: Meteor.user().username,
//        page: window.location.pathname,
//        viewportWidth: $('#paraview-viewport-container').innerWidth(),
//        viewportHeight: $('#paraview-viewport-container').innerHeight(),
//        session: {_id: PV.getSessionId()},
//        sharedState: SharedStateVals[SharedStateVals.INITIALIZED],
//        partnerUsername: null,
//        jobId: Session.get('currentJobId'),
//        timestamp: Date.now()
//    };
//};
//var initializeParaviewSessionInfo = function initializeParaviewSessionInfo(username?: string) {
//    var session = getInitializedParaviewSessionInfo();
//    if (username) session.username = username;
//
//    Meteor.call('upsertParaviewSession', session, (error, result) => {
//        if (error) {
//            console.error(error);
//            return;
//        }
//        isInitializing = false;
//    });
//};
//var initializeParaviewViewport = function initializeParaviewViewport() {
//    //TODO: poor test to see if had joined another session and needs to return to its own session
//    if (originalParaviewSessionId) {
//        PV.setSessionId(originalParaviewSessionId);
//        PV.rebindViewport();
//        originalParaviewSessionId = null;
//    }
//
//    //console.log('Clearing refreshIntervalId in initialize ****** ');
//    Meteor.clearInterval(refreshIntervalId);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 10);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 20);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 30);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 40);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 50);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 100);
//    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 200);
//
//    $('#paraview-viewport-container').innerWidth('');
//    $('#paraview-viewport-container').innerHeight('');
//
//    // Give above changes a chance to happen
//    Meteor.setTimeout(function () {
//        if (!PV.session) return;
//        PV.render();     // PV.render() uses dimensions of #paraview-viewport by default
//        PV.resetViewport();
//        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
//        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
//    }, 300);
//};
var initializeListeners = function initializeListeners() {
    listenForInitializedSharedState();
    //listenForProposedSharing();
    //listenForSharedSession();
};
var initialize = function initialize() {
    Session.set('hasJoinedParaviewSessionOf', null);
    Session.set('hasSharedParaviewSessionWith', null);
    //initializeParaviewViewport();
    initializeListeners();
};
Template['paraviewSharedSessionControls'].onCreated(function () {
    //paraviewSettingsHandle = Meteor.subscribe('paraviewSettings');
    userStatusHandle = Meteor.subscribe('userStatus');
    isInitializing = true;
    //var intervalId = Meteor.setInterval(() => {
    //    var page = window.location.pathname;
    //    console.log('page = ' + page);
    //    if (page === '/geothermalsimulation') Meteor.clearInterval(intervalId);
    //}, 10);
});
Template['paraviewSharedSessionControls'].onRendered(function () {
    templateInstance = this; // set page-scoped var
    waitForTruthy(Meteor.user, initialize);
    // This block ensures that the client's current paraview info is saved, including paraview-viewport-container size.
    // Happens on page rendering and when page is resized
    //waitForTruthy(PV.isConnected, () => {
    //    this.autorun(() => {
    //        var viewportSize = Session.get('graphicsViewportSize'); // reactive, triggers autorun
    //        initializeParaviewSessionInfo();   //TODO: probably want to save specific parts, not initialize (and reset) on resize, e.g. if sharing
    //    });
    //});
});
var thisUserCanShare = function thisUserCanShare() {
    var thisUser = Meteor.user();
    //console.log('Stringified, thisUserCanShare()' + JSON.stringify(thisUser, null, 4));
    if (!thisUser || !thisUser['sharing'] || thisUser['sharing']['status'] !== SharedStateVals[SharedStateVals.INITIALIZED])
        return false;
    //console.log('thisUserCanShare() returning true');
    return true;
};
var getShareableOtherUsers = function getShareableOtherUsers() {
    return Meteor.users.find({
        username: { $ne: Meteor.user().username },
        'status.online': true,
        'sharing.status': SharedStateVals[SharedStateVals.INITIALIZED]
    });
};
Template['paraviewSharedSessionControls'].helpers({
    canShare: function () {
        if (!thisUserCanShare())
            return false;
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
        var partnerId = event.target.getAttribute('data-partner-id'), thisUser = Meteor.user();
        UserHelper.initializeSharingState(thisUser._id);
        UserHelper.initializeSharingState(partnerId);
    }
});
Template['paraviewSharedSessionControls'].onDestroyed(function () {
    Meteor.clearInterval(refreshIntervalId); // not sure this is necessary
});
//# sourceMappingURL=paraview_shared_session_controls.js.map