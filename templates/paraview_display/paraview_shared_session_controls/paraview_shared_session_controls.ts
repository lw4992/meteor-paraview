/// <reference path='../../../../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
/// <reference path='../../../../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />

interface ParaviewSessionsDAO {
    _id?: string;
    username?: string;
    page?: string;
    viewportWidth?: number;
    viewportHeight?: number;
    session?: {};
    sharedState?: string;
    partnerUsername?: string;
    timestamp?: number;
}
declare var ParaviewSessions:Mongo.Collection<ParaviewSessionsDAO>;
enum SharedStateVals { INITIALIZED /* 0 */, PROPOSING /* 1 */, PROPOSED_TO /* 2 */, SHARED /* 3 */, JOINED /* 4 */, STOPPED /* 5 */ };

/**
 * It's much easier to control the size of #paraview-viewport indirectly by controlling the size of the container, #paraview-viewport-container
 */
var refreshIntervalId:number = null,
    templateInstance:Blaze.TemplateInstance;

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

var setViewportToSmallest = function setViewportToSmallest(partnerParaviewSession:ParaviewSessionsDAO) {
    var currentWidth = $('#paraview-viewport-container').innerWidth();
    var currentHeight = $('#paraview-viewport-container').innerHeight();
    if (currentWidth > partnerParaviewSession.viewportWidth) $('#paraview-viewport-container').innerWidth(partnerParaviewSession.viewportWidth);
    if (currentHeight > partnerParaviewSession.viewportHeight) $('#paraview-viewport-container').innerHeight(partnerParaviewSession.viewportHeight);
    Meteor.setTimeout(function () {
        PV.render();  // PV.render() uses dimensions of #paraview-viewport by default
        PV.resetViewport();
        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
    }, 300);
};

var proposeSharedSession = function proposeSharedSession(usernameProposedTo) {
    //console.log('SharedStateVals = ' + JSON.stringify(SharedStateVals, null, 4));
    //console.log('PROPOSED_TO = ' + SharedStateVals[SharedStateVals.PROPOSED_TO]);

    var thisUserSession = getInitializedParaviewSessionInfo();
    thisUserSession.sharedState = SharedStateVals[SharedStateVals.PROPOSING];
    thisUserSession.partnerUsername = usernameProposedTo;
    Meteor.call('upsertParaviewSession', thisUserSession);

    var partnerUserSession = getInitializedParaviewSessionInfo();
    partnerUserSession.username = usernameProposedTo;
    partnerUserSession.sharedState = SharedStateVals[SharedStateVals.PROPOSED_TO];
    partnerUserSession.partnerUsername = Meteor.user().username;
    Meteor.call('upsertParaviewSession', partnerUserSession);
};

var startSharingSession = function startSharingSession(proposerUsername) {
    //if (proposedSharingComputation) proposedSharingComputation.stop();
    //if (sharingComputation) sharingComputation.stop();

    var thisUserSession = getInitializedParaviewSessionInfo();
    thisUserSession.sharedState = SharedStateVals[SharedStateVals.JOINED];
    thisUserSession.partnerUsername = proposerUsername;
    Meteor.call('upsertParaviewSession', thisUserSession);
    Session.set('hasJoinedParaviewSessionOf', proposerUsername);

    var partnerUserSession: ParaviewSessionsDAO = <ParaviewSessionsDAO> ParaviewSessions.findOne({ username: proposerUsername });
    partnerUserSession.sharedState = SharedStateVals[SharedStateVals.SHARED];
    partnerUserSession.partnerUsername = Meteor.user().username;
    Meteor.call('upsertParaviewSession', partnerUserSession);

    setViewportToSmallest(partnerUserSession);

    initializeSimpleChat();

    refreshIntervalId = Meteor.setInterval(function () {
        //console.log('rendering for joiner');
        PV.render();    // PV.render() uses dimensions of #paraview-viewport by default
    }, 100);
};

var getSessionFromSharedState = function getSessionFromSharedState(sharedState: string) {
    var paraviewSession = ParaviewSessions.findOne({
        username: Meteor.user().username,
        page: window.location.pathname,
        sharedState: sharedState
    }, {sort: {timestamp: 'desc'}});
    return paraviewSession;
};

var hasSharedState = function hasSharedState(sharedState:string) {
    return !!getSessionFromSharedState(sharedState);
};

var getPartnerUsername = function getPartnerUsername() {
    var paraviewSettings = ParaviewSessions.findOne({
        username: Meteor.user().username,
        page: window.location.pathname
    }, {sort: {timestamp: 'desc'}});
    if (paraviewSettings) return paraviewSettings.partnerUsername;
};

var initializeSimpleChat = function initializeSimpleChat() {
    SimpleChat.configure({
        roomId: 'paraviewSimpleChat',
        userId: Meteor.user().username
    });
    SimpleChat.removeAllMessages();
};

// This client is in proposed state and other user accepts/starts sharing
var listenForSharedSession = function listenForSharedSession() {
    var thisUserSession = null,
        partnerSession = null;

    templateInstance.autorun(function () {
        thisUserSession = getSessionFromSharedState(SharedStateVals[SharedStateVals.SHARED]);
        //console.log('thisUserSession = ' + JSON.stringify(thisUserSession));
        if (thisUserSession) {
            //console.log('about to set refresh interval');
            refreshIntervalId = Meteor.setInterval(function () {
                //console.log('rendering for proposer');
                PV.render();    // PV.render() uses dimensions of #paraview-viewport by default

            }, 100);
            partnerSession = ParaviewSessions.findOne({ username: thisUserSession.partnerUsername });
            setViewportToSmallest(partnerSession);
            initializeSimpleChat();
            Session.set('hasSharedParaviewSessionWith', thisUserSession.partnerUsername);
        } else {
//            console.log('clearing interval in listener');
            Meteor.clearInterval(refreshIntervalId);
        }
    });
};

// This client is not sharing and other user proposes sharing
var listenForProposedSharing = function () {
    templateInstance.autorun(function () {
        if (hasSharedState(SharedStateVals[SharedStateVals.PROPOSED_TO])) {
            templateInstance.$('#proposed-to-modal').modal('show');
        }
    });
};

var listenForInitializedSharedState = function listenForInitializedSharedState() {
    templateInstance.autorun(function() {
        if (hasSharedState(SharedStateVals[SharedStateVals.INITIALIZED])) {
            //console.log('Initializing!!!');
            Session.set('hasJoinedParaviewSessionOf', null);
            Session.set('hasSharedParaviewSessionWith', null);
            templateInstance.$('#proposed-to-modal').modal('hide');
            initializeParaviewViewport();
        }
    });
};

var getInitializedParaviewSessionInfo = function getInitializedParaviewSessionInfo() {
    return {
        username: Meteor.user().username,
        page: window.location.pathname,
        viewportWidth: $('#paraview-viewport-container').innerWidth(),
        viewportHeight: $('#paraview-viewport-container').innerHeight(),
        session: {_id: PV.getSessionId()},
        sharedState: SharedStateVals[SharedStateVals.INITIALIZED],
        partnerUsername: null,
        timestamp: Date.now()
    };
};

var initializeParaviewSessionInfo = function initializeParaviewSessionInfo(username?: string) {
    var session = getInitializedParaviewSessionInfo();
    if (username) session.username = username;

    Meteor.call('upsertParaviewSession', session);
};

var initializeParaviewViewport = function initializeParaviewViewport() {
    //console.log('Clearing refreshIntervalId in initialize ****** ');
    Meteor.clearInterval(refreshIntervalId);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 10);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 20);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 30);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 40);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 50);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 100);
    Meteor.setTimeout(() => { Meteor.clearInterval(refreshIntervalId) }, 200);

    $('#paraview-viewport-container').innerWidth('');
    $('#paraview-viewport-container').innerHeight('');

    // Give above changes a chance to happen
    Meteor.setTimeout(function () {
        if (!PV.session) return;
        PV.render();     // PV.render() uses dimensions of #paraview-viewport by default
        PV.resetViewport();
        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
    }, 300);
};

var initializeListeners = function initializeListeners() {
    listenForInitializedSharedState();
    listenForProposedSharing();
    listenForSharedSession();
};

var removeLoggedOutParaviewSessions = function removeLoggedOutParaviewSessions() {
    var loggedOutUsersCursor = null;

    // reactive on collections ParaviewSettings and Meteor.users
    templateInstance.autorun(function () {
        loggedOutUsersCursor = Meteor.users.find({'status.online': false});
        loggedOutUsersCursor.forEach(user => {
            Meteor.call('removeParaviewSessionsForUsername', user.username);
        });
    });
};

var initialize = function initialize() {
    Session.set('hasJoinedParaviewSessionOf', null);
    Session.set('hasSharedParaviewSessionWith', null);

    removeLoggedOutParaviewSessions();
    initializeParaviewViewport();
    initializeListeners();
};

Template['paraviewSharedSessionControls'].onCreated(function () {
    Meteor.subscribe('paraviewSettings');
    Meteor.subscribe('userStatus');
});

Template['paraviewSharedSessionControls'].onRendered(function () {
    templateInstance = this; // set page-scoped var

    waitForTruthy(Meteor.user, initialize);

    // This block ensures that the client's current paraview info is saved, including paraview-viewport-container size.
    // Happens on page rendering and when page is resized
    waitForTruthy(PV.isConnected, () => {
        this.autorun(() => {
            var viewportSize = Session.get('graphicsViewportSize'); // reactive, triggers autorun
            initializeParaviewSessionInfo();   //TODO: probably want to save specific parts, not initialize (and reset) on resize, e.g. if sharing
        });
    });
});

Template['paraviewSharedSessionControls'].helpers({
    canShare: function () {
        if (!hasSharedState(SharedStateVals[SharedStateVals.INITIALIZED])) return false;

        var otherUsers = ParaviewSessions.findOne({
            page: window.location.pathname,
            username: {$ne: Meteor.user().username},
            sharedState: SharedStateVals[SharedStateVals.INITIALIZED]
        });
        return !!otherUsers;
    },
    otherUsers: function () {
        var otherUsers = ParaviewSessions.find({
            page: window.location.pathname,
            username: {$ne: Meteor.user().username},
            sharedState: SharedStateVals[SharedStateVals.INITIALIZED]
        });
        return otherUsers;
    },
    isProposing: function () {
        return hasSharedState(SharedStateVals[SharedStateVals.PROPOSING]);  // reactive function
    },
    partnerUsername: function () {
        return getPartnerUsername();
    },
    isJoined: function () {
        return hasSharedState(SharedStateVals[SharedStateVals.JOINED]);  // reactive function
    },
    isShared: function () {
        return hasSharedState(SharedStateVals[SharedStateVals.SHARED]);  // reactive function
    }
});

Template['paraviewSharedSessionControls'].events({
    'click [data-share-session-link]': function (event, template) {
        event.preventDefault();
        var username = event.target.getAttribute('data-username');
        proposeSharedSession(username);
    },
    'click [data-accept-proposal]': function (event, template) {
        var partnerUsername = event.target.getAttribute('data-partner-username');
        startSharingSession(partnerUsername);
    },
    'click [data-decline-proposal]': function (event, template) {
        initializeParaviewSessionInfo();
        var partnerUsername = event.target.getAttribute('data-partner-username');
        initializeParaviewSessionInfo(partnerUsername);
    },
    'click [data-reset-sessions]': function (event, template) {
        initializeParaviewSessionInfo();
        var partnerUsername = event.target.getAttribute('data-partner-username');
        initializeParaviewSessionInfo(partnerUsername);
    },

    //TODO:  checkl this
    // this event listener can be removed once each session is on a separate paraview server
    'mousedown #viewport-graphics': function () {
        var paraviewSettings = ParaviewSessions.findOne({page: window.location.pathname}, {sort: {timestamp: -1}});
        if (paraviewSettings && paraviewSettings.username !== Meteor.user().username) {  // Some other user last touched this page
            initializeParaviewViewport();
            initializeParaviewSessionInfo(); //TODO: probably want to save specific parts, not initialize
        }
    }
});

Template['paraviewSharedSessionControls'].onDestroyed(function () {
    Meteor.clearInterval(refreshIntervalId); // not sure this is necessary
});