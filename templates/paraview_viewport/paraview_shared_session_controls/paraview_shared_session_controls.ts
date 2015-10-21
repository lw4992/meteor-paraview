/// <reference path='../../../../../.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../../../.typescript/custom_defs/all-custom-definitions.d.ts' />

enum SharedStateVals { NOT_SHARED /* 0 */, PROPOSED /* 1 */, SHARED /* 2 */, STOPPED /* 3 */ };

/**
 * It's much easier to control the size of #paraview-viewport indirectly by controlling the size of the container, #paraview-viewport-container
 */
var refreshIntervalId: number;
var currentSharedState = SharedStateVals.NOT_SHARED;
var sharingSessionWith = new ReactiveVar('');
var paraviewComputation: Tracker.Computation;
var viewportSizeComputation: Tracker.Computation;
var proposedSharingComputation: Tracker.Computation;
var sharingComputation: Tracker.Computation;
var stoppedSharingComputation: Tracker.Computation;
var isProposer = false;

var setViewportToSmallest = function(paraviewSettings: ParaviewSettingsDAO) {
    var currentWidth = $('#paraview-viewport-container').innerWidth();
    var currentHeight = $('#paraview-viewport-container').innerHeight();
    if (currentWidth > paraviewSettings.viewportWidth) $('#paraview-viewport-container').innerWidth(paraviewSettings.viewportWidth);
    if (currentHeight > paraviewSettings.viewportHeight) $('#paraview-viewport-container').innerHeight(paraviewSettings.viewportHeight);
    Meteor.setTimeout(function() {
        PV.render();  // PV.render() uses dimensions of #paraview-viewport by default
        PV.resetViewport();
        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
    }, 300);
};

var setViewportToNormal = function() {
    $('#paraview-viewport-container').innerWidth('');
    $('#paraview-viewport-container').innerHeight('');

    // Give above changes a chance to happen
    Meteor.setTimeout(function() {
        if (!PV.session) return;
        PV.render();     // PV.render() uses dimensions of #paraview-viewport by default
        PV.resetViewport();
        //console.log('paraview-viewport new width = ' + $('#paraview-viewport').innerWidth());
        //console.log('paraview-viewport new height = ' + $('#paraview-viewport').innerHeight());
    }, 300);
};

var saveParaViewInfo = function() {
    var settings = {
        username: Meteor.user().username,
        page: Router.current().route.getName(),
        viewportWidth: $('#paraview-viewport-container').innerWidth(),
        viewportHeight: $('#paraview-viewport-container').innerHeight(),
        session: {_id: PV.session._id},
        sharedState: currentSharedState,   //currentSharedState is page-scoped var
        sharingSessionWith: sharingSessionWith.get(),
        timestamp: Date.now()
    };
    //console.log('Inserting settings' + JSON.stringify(settings, null, 4));
    ParaviewSettings.insert(settings);
};

var removeOldParaviewSettings = function() {
    var paraviewSettingsCursor: Mongo.Cursor<ParaviewSettingsDAO> = ParaviewSettings.find({page: Router.current().route.getName(),  username: Meteor.user().username});
    paraviewSettingsCursor.forEach(function(paraviewSettings) {
        ParaviewSettings.remove(paraviewSettings._id, function(error) {
            if (error) {
                console.log('Error = ' + error);
            }
        });
    });
};

var updateParaViewInfoStopSharing = function() {
    var paraviewSettingsCursor: Mongo.Cursor<ParaviewSettingsDAO> = ParaviewSettings.find({page: Router.current().route.getName(),  username: Meteor.user().username, sharedState: {$in: [SharedStateVals.SHARED, SharedStateVals.PROPOSED]}});
    paraviewSettingsCursor.forEach(function(paraviewSettings) {
        ParaviewSettings.update(paraviewSettings._id, {$set: {sharedState: SharedStateVals.STOPPED}}, {}, function(error, result) {
            if (error) console.log('Error = ' + error);
        });
    });

    // multi can't be true on client code, so can't do the following
    //ParaviewSettings.update({'username': Meteor.user().username,  currentSharedState: {$in: [ SharedStateVals.SHARED, SharedStateVals.PROPOSED ]}, {$set: {currentSharedState: SharedStateVals.STOPPED}}, {multi: true});
};

var proposeSharedSession = function () {
    var paraviewSettings = ParaviewSettings.findOne({page: Router.current().route.getName(), username: {$ne: Meteor.user().username}, sharedState: SharedStateVals.NOT_SHARED}, {sort: {timestamp: -1}});
    if (paraviewSettings) {
        console.log('Proposing sharing session with: ' + paraviewSettings.username);

        if (proposedSharingComputation) proposedSharingComputation.stop();

        currentSharedState = SharedStateVals.PROPOSED;
        sharingSessionWith.set(paraviewSettings.username);
        isProposer = true;
        saveParaViewInfo();

    } else {
        console.log('No one found to share with!');
    }
};

var initialize = function() {
    console.log('Running paraview_shared_session_controls initialize(), Meteor.user() = ' + Meteor.user());
    currentSharedState = SharedStateVals.NOT_SHARED; // currentSharedState is page-scoped var
    sharingSessionWith.set('');
    isProposer = false;
    removeOldParaviewSettings();
    setViewportToNormal();
    Meteor.clearInterval(refreshIntervalId);
    var intervalId = Meteor.setInterval(function() {
        if (!PV.session) return;
        saveParaViewInfo();
        Meteor.clearInterval(intervalId);
    }, 100);

    listenForProposedSharing();
    listenForSharedSession();
    listenForStoppedSharing();

    $('#enable-shared-session').show();
    $('#now-sharing-session-area').hide();
};

var startSharingSession = function(paraviewSettings) {
    if (proposedSharingComputation) proposedSharingComputation.stop();
    if (sharingComputation) sharingComputation.stop();

    currentSharedState = SharedStateVals.SHARED;
    sharingSessionWith.set(paraviewSettings.username);
    setViewportToSmallest(paraviewSettings);
    saveParaViewInfo();

    refreshIntervalId = Meteor.setInterval(function() {
        PV.render();    // PV.render() uses dimensions of #paraview-viewport by default
    }, 100);

    $('#enable-shared-session').hide();
    $('#now-sharing-session-area').show();
};

var stopSharingSession = function() {
    if (stoppedSharingComputation) stoppedSharingComputation.stop();
    updateParaViewInfoStopSharing();

    currentSharedState = SharedStateVals.STOPPED; // currentSharedState is page-scoped var
    saveParaViewInfo();

    Meteor.setTimeout(initialize, 200);
    Meteor.setTimeout(setViewportToNormal, 1000);
};

// This client is not sharing and other user proposes sharing
var listenForProposedSharing = function() {
    proposedSharingComputation = Tracker.autorun(function() {
        if(!Meteor.user()) return;
        var paraviewSettings = ParaviewSettings.findOne({page: Router.current().route.getName(), sharingSessionWith: Meteor.user().username, sharedState: SharedStateVals.PROPOSED}, {sort: {timestamp: 'desc'}});
        if (paraviewSettings && currentSharedState === SharedStateVals.NOT_SHARED) startSharingSession(paraviewSettings);
    });
};

// This client is in proposed state and other user accepts/starts sharing
var listenForSharedSession = function() {
    sharingComputation = Tracker.autorun(function() {
        if(!Meteor.user()) return;
        var paraviewSettings = ParaviewSettings.findOne({page: Router.current().route.getName(), sharingSessionWith: Meteor.user().username, sharedState: SharedStateVals.SHARED}, {sort: {timestamp: 'desc'}});
        if (paraviewSettings && currentSharedState === SharedStateVals.PROPOSED) startSharingSession(paraviewSettings);
    });
};

// This client is sharing and other user stops sharing
var listenForStoppedSharing = function() {
    stoppedSharingComputation = Tracker.autorun(function() {
        if(!Meteor.user()) return;
        var paraviewSettings = ParaviewSettings.findOne({page: Router.current().route.getName(), sharingSessionWith: Meteor.user().username, sharedState: SharedStateVals.STOPPED}, {sort: {timestamp: 'desc'}});
        if (paraviewSettings && currentSharedState === SharedStateVals.SHARED) stopSharingSession();
    });
};

Template['paraviewSharedSessionControls']['rendered'] = function() {
    Meteor.subscribe('paraviewSettings');

    var checkFunc = function() {
        return Meteor.user() && ServerSettings.findOne();
    };
    DAUtil.waitForTruthy(checkFunc, function() {
        initialize();
    });

    //var startTime = Date.now();
    //var intervalTime = 100;
    //var timeout = 10000;
    //var intervalId = Meteor.setTimeout(function() {
    //    console.log('checking Meteor.user() ----------');
    //    if (Meteor.user()) {
    //        Meteor.clearInterval(intervalId);
    //        initialize();
    //    } else if (Date.now() > startTime + timeout) {
    //        Meteor.clearInterval(intervalId);
    //        throw new Meteor.Error('not-logged-in', 'User not logged in, no value for Meteor.user()');
    //    }
    //}, intervalTime);

    //Meteor.setTimeout(function(){
    //    initialize(); // in case last left page in weird state
    //}, 2000);

    // This block ensures that the client's current paraview info is saved, including paraview-viewport-container size.
    // Happens on page rendering and when page is resized
    Meteor.setTimeout(function(){
        $('#viewport-graphics').css('background-color', '#f9f9f9');
        if (PV.session && PV.session._id) {
            viewportSizeComputation = Tracker.autorun(function() {
                var viewportSize = Session.get('graphicsViewportSize');
                saveParaViewInfo();
            });
        }
    }, 2000);
};

Template['paraviewSharedSessionControls']['helpers']({
    sharingWith: function() {
        return sharingSessionWith.get();
    }
});

Template['paraviewViewport']['events']({
    'click #enable-shared-session': function() {
        proposeSharedSession();
    },
    'click #disable-shared-session': function() {
        stopSharingSession();
    },

    // this event listener can be removed once each session is on a separate paraview server
    'mousedown #viewport-graphics': function() {
        if (currentSharedState === SharedStateVals.SHARED) return;
        var paraviewSettings = ParaviewSettings.findOne({page: Router.current().route.getName()}, {sort: {timestamp: -1}});
        if (paraviewSettings && paraviewSettings.username !== Meteor.user().username) {  // Some other user last touched this page
            setViewportToNormal();
            saveParaViewInfo();
        }
    }
});

Template['paraviewSharedSessionControls']['destroyed'] = function() {
    if (paraviewComputation) paraviewComputation.stop();
    if (viewportSizeComputation) viewportSizeComputation.stop();
    if (proposedSharingComputation) proposedSharingComputation.stop();
    if (sharingComputation) sharingComputation.stop();
    if (stoppedSharingComputation) stoppedSharingComputation.stop();
    Meteor.clearInterval(refreshIntervalId); // not sure this is necessary
    removeOldParaviewSettings();
};