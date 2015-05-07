/// <reference path='../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
var connectionComputation;
PV = {
    session: null,
    viewport: null,
    paused: true,
    lastFrameTime: 0,
    currentFrameTime: 0,
    filterProperties: {},
    filterUI: {},
    elements: new ReactiveVar([]),
    elementOpacities: {},
    elementSettings: [],
    lastMTime: 0,
    activeViewId: -1,
    mainElementId: 0,
    activeElementId: 0,
    activeRepId: 0,
    fileElementIdMap: {},
    filesForRemoval: [],
    viewportCssId: '#paraview-viewport',
    activeColorArrayLocation: '',
    activeColorArrayName: '',
    serverSessionManagerUrl: '',
    serverSessionUrl: '',
    backgroundSetting: {
        id: 0,
        value: [0.9765, 0.9765, 0.9765],
        name: "Background"
    },
    scalarBar: new ReactiveVar({
        display: false,
        areDiscreteValues: false,
        labelsAndColors: []
    })
};
/**
 *  @module PV
 */
/**
 *
 * @type {ReactiveVar<ScalarBarOpts>} scalarBar - A custom scalar bar that is the key for any coloring in the visualization
 */
PV.scalarBar = new ReactiveVar({
    display: false,
    areDiscreteValues: false,
    labelsAndColors: []
});
//PV.setScalarBar = function(opts, asyncCallback?: iPVCallback) {
////    console.log('** Starting setScalarBarSyncable, visibilityMap = ' + JSON.stringify(options.visibilityMap));
//    PV.session.call('pv.color.manager.scalarbar.visibility.set', [options.visibilityMap]).then(function(result) {
//        if (!options.noCallback) asyncCallback && asyncCallback(null, {success: true});  // Doesn't seem like this needs to block, but bad if a new element became last element before completion
//    }, asyncCallback);
//};
//
//PV.removeScalarBar = function(sourceId, asyncCallback?: iPVCallback) {
//    var scalarBarOptions = {
//        visibilityMap: {}
//    };
//    scalarBarOptions.visibilityMap[sourceId] = false;
//    PV.setScalarBar(scalarBarOptions, asyncCallback);
//};
//
//PV.removeAllScalarBars = function(asyncCallback?: iPVCallback) {
////    console.log('** Starting removeAllScalarBarsSyncable()');
//    if (!PV.proxies || PV.proxies.length === 0) return asyncCallback && asyncCallback(null, {success: true});
//    _.each(PV.proxies, function(element, i) {
//        var scalarBarOptions = {
//            visibilityMap: {}
//        };
//        scalarBarOptions.visibilityMap[element.id] = false;
//        if (i !== PV.proxies.length - 1) scalarBarOptions.noCallback = true;
//        PV.setScalarBar(scalarBarOptions, asyncCallback);
//    });
//};
/**
 * This is the standard Node-style callback that is passed into all methods listed below.
 *
 * @callback requestCallback
 * @param {Object} error -- null (or undefined) if no error, an error object if there is an error
 * @param {Object} success -- undefined if error, some success object if method completes successfully
 */
/**
 * Set initial configurations for paraview, such as viewportCssId or backgroundSetting.
 *
 * @param {Object} opts - configuration options
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 * @example
 *         PV.config({
 *             serverSessionManagerUrl: 'http://localhost:9000/paraview',
 *             viewportCSSId: '#paraview-viewport',
 *             backgroundSetting: {
 *                 value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
 *                 name: "Background"
 *         });
 */
PV.config = function config(opts, asyncCallback) {
    _.extend(PV, opts);
    asyncCallback && asyncCallback(null, { success: true });
};
/**
 * Remove all the elements from the server.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.removeAllElements = function removeAllElements(asyncCallback) {
    //    console.log('** Starting removeAllElements()');
    var numElements = PV.elements.get().length;
    if (numElements === 0)
        asyncCallback(null, { success: true });
    var i = numElements;
    while (i--) {
        if (i === 0) {
            PV.removeElement(JSON.parse(JSON.stringify(PV.elements.get()[i].id)), asyncCallback);
        }
        else {
            PV.removeElement(JSON.parse(JSON.stringify(PV.elements.get()[i].id)), asyncCallback);
        }
    }
};
/**
 * Remove single element from the server
 *
 * @param {number} elementId - id of element to be removed
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.removeElement = function removeElement(elementId, asyncCallback) {
    //    console.log('** Starting removeElement()');
    PV.session.call('pv.proxy.manager.delete', [elementId]).then(function (result) {
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
PV._connect = function connect() {
    Session.set('pvwConnected', false);
    var config = {
        // From client/lib/paraview/lib/core/vtkWebAll.js, which is set by Meteor.settings.public.paraview.sessionManagerURL
        sessionManagerURL: PV.serverSessionManagerUrl,
        //sessionManagerURL: Meteor.settings['public']['paraview']['sessionManagerUrl'],
        //        sessionURL: vtkWeb.properties.sessionURL,  // Don't use so that sessionManagerURL is used
        application: "pipeline"
    };
    console.log('ParaView connection config = ' + JSON.stringify(config, null, 4));
    var stop = vtkWeb.NoOp;
    var start = function (connection) {
        //console.log('Stringified, connection = ' + JSON.stringify(connection, null, 4));
        PV.session = connection.session;
        // Update stop method to use the connection
        stop = function () {
            connection.session.call('vtk:exit');
            PV.session = null;
            Session.set('pvwInitialized', false);
            PV.removeAllElements(function (error, result) {
                if (error)
                    return PV._onError(error);
            });
        };
        Session.set('pvwConnected', true);
        //        console.log('ending start function, PV.session = ' + JSON.stringify(PV.session, null, 4));
    };
    vtkWeb.smartConnect(config, start, function (code, reason) {
        //$(".loading").hide();
        console.log(reason);
        PV.session = null;
        Session.set('pvwInitialized', false);
        PV.removeAllElements(function (error, result) {
            if (error)
                return PV._onError(error);
        });
    });
};
PV._bindViewport = function _bindViewport(session) {
    var viewportOptions = {
        session: session || PV.session,
        view: -1,
        enableInteractions: true,
        renderer: 'image' //image or webgl
    };
    var viewport = vtkWeb.createViewport(viewportOptions);
    viewport.bind(PV.viewportCssId);
    PV.viewport = viewport;
};
/**
 * Creates a session with the ParaView session if one does not exist already.  Reuses existing session if one already exists.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.initSession = function initSession(asyncCallback) {
    //console.log('** Starting initSession(), asyncCallback = ' + asyncCallback);
    if (!PV.session) {
        Session.set('pvwConnected', false);
        console.log('Creating connection and session with ParaView Server...');
        PV._connect();
        connectionComputation = Tracker.autorun(function () {
            var isConnected = Session.get('pvwConnected');
            if (isConnected) {
                PV._bindViewport(); // I think all of this is synchronous
                //                console.log('Completed initializeSyncable(), PV.session._wsuri = ' + PV.session._wsuri + ',  PV.session._session_id = ' + PV.session._session_id + ',  PV.session._websocket_connected = ' + PV.session._websocket_connected);
                console.log('Created session with ParaView server, PV.session._id = ' + PV.session._id + ',  PV.session._socket.url = ' + PV.session._socket.url + ',  PV.session._socket.readyState = ' + PV.session._socket.readyState);
                //console.log('PV.session = ' + JSON.stringify(PV.session, null, 4));
                PV._saveServerElementInfo(asyncCallback);
                //asyncCallback && asyncCallback(null, {success: true});
                connectionComputation.stop();
            }
        });
    }
    else {
        console.log('Already connected to ParaView Server, reusing session');
        PV._bindViewport();
        PV._saveServerElementInfo(asyncCallback);
    }
};
PV._onError = function _onError(error) {
    console.log('Error: ' + JSON.stringify(error));
};
// Given an array of elements, return the element with the given elementId
PV._getElement = function _getElement(elements, elementId) {
    var element = _.find(elements, function (element) {
        return element.id === elementId;
    });
    return element;
};
PV._getRepId = function _getRepId(elements, elementId) {
    var element = PV._getElement(elements, elementId);
    return element && element.rep;
};
// Elements are returned by the paraview server in any order.  Save the element info in the order the elements were created.
PV._saveServerElementInfo = function _saveServerElementInfo(asyncCallback) {
    //    console.log('** Starting _saveServerElementInfo()');
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        if (result && result.view)
            PV.activeViewId = result.view;
        //console.log('result.view = ' + result.view);
        if (result && result.sources && result.sources.length !== 0) {
            PV.activeElementId = PV.activeElementId || result.sources[result.sources.length - 1].id; // If calling for first time, make last element the active one
            PV.activeRepId = PV._getRepId(result.sources, PV.activeElementId);
            var elements = _.sortBy(result.sources, function (element) {
                return element.id;
            });
            PV.elements.set(elements);
        }
        //        console.log('PV.elements.get() = ' + JSON.stringify(PV.elements.get()));
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
/**
 * Render a file, which should be accessible by the ParaView server.
 *
 * @param path
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.addFile = function addFile(path, asyncCallback) {
    console.log('Starting addFile(), relativeFilePath = ' + path);
    PV.session.call("pv.proxy.manager.create.reader", [path]).then(function (reply) {
        console.log('pv.proxy.manager.create.reader() reply = ' + JSON.stringify(reply));
        PV.mainElementId = reply.id;
        PV.activeElementId = reply.id;
        PV.fileElementIdMap[path] = reply.id;
        PV._saveServerElementInfo(asyncCallback);
    }, asyncCallback);
};
/**
 * Refresh the viewport with any changes to the server
 *
 * @param {number} width - optional width.  Default is width of element specified by viewportCssId
 * @param {number} height - optional height.  Default is height of element specified by viewportCssId
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.render = function render(width, height, asyncCallback) {
    //console.log('** Starting render(), width = ' + width);
    var width = width || $(PV.viewportCssId).innerWidth();
    var height = height || $(PV.viewportCssId).innerHeight();
    var renderCfg = {
        "size": [width, height],
        "view": PV.activeViewId,
        "mtime": PV.lastMTime,
        "quality": 100,
        "localTime": Date.now()
    };
    //console.log('rendering with viewport size = ' + renderCfg.size);
    PV.session.call("viewport.image.render", [renderCfg]).then(function (result) {
        //console.log('viewport.image.render result = ' + JSON.stringify(result, null, 4));
        PV.lastMTime = result.mtime;
        PV.viewport.invalidateScene();
        if (asyncCallback)
            asyncCallback(null, { success: true });
    });
};
/**
 * Recenter and rescale all visible visualizations.  Calls PV.render() to display changes.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.resetViewport = function resetViewport(asyncCallback) {
    //console.log('** Starting resetViewPort(), PV.activeViewId = ' + PV.activeViewId);
    if (!PV.session) {
        asyncCallback && asyncCallback(null, { success: true });
        return;
    }
    //Session.get('graphicsViewportSize');  // sole purpose of this line is to enable this function to be reactive if wrapped in a Deps.autorun, so a viewport size change will trigger this function again.
    PV.session.call("viewport.camera.reset", [PV.activeViewId]).then(function (result) {
        //        console.log('viewport.camera.reset result = ' + JSON.stringify(result));
        PV.render(null, null, asyncCallback);
    });
};
/**
 * Color an element (proxy).  Called by PV.colorCells() and PV.colorPoints().
 *
 * @param {Array} colorOptsArray - tells server how to color the element
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 * @example colorOptsArray has this format:
 *
 *         [
 *             elementRepId: string,    // required
 *             colorMode: string,       // required, "SOLID" or "ARRAY"
 *             arrayLocation: string,   // optional, string, "POINTS" or "CELLS", defaults to "POINTS"
 *             arrayName: string,       // optional, string, defaults to ""
 *             vectorMode: string       // optional, string, defaults to "Magnitude"
 *             vectorComponent?: number // optional, number, defaults to 0
 *             rescale: boolean         // optional, boolean, defaults to false
 *         ]
 */
// API options found here:  http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api/protocols.ParaViewWebColorManager
// A complete displayProps should look like [PV.activeRepId, colorMode, arrayLocation, arrayName, vectorMode, vectorComponent, rescale];
PV.colorElement = function colorElement(colorOptsArray, asyncCallback) {
    //console.log('colorElement(), colorOptsArray = ' + JSON.stringify(colorOptsArray, null, 4));
    PV.session.call('pv.color.manager.color.by', colorOptsArray).then(function () {
        asyncCallback && asyncCallback(null, { success: true }); // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, asyncCallback);
};
/**
 * Colors cells of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'CELLS', elementName])
 *
 * @param {string} elementName - name of layer, specified in visualization file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.colorCells = function colorCells(elementName, asyncCallback) {
    PV.colorElement([PV.activeRepId, 'ARRAY', 'CELLS', elementName, 'Magnitude', 0, false], asyncCallback);
};
/**
 * Colors points of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'POINTS', elementName, 'Magnitude', 0, true]) *
 *
 * @param {string} elementName - name of layer, specified in visualization file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.colorPoints = function colorPoints(elementName, asyncCallback) {
    var displayProps = [PV.activeRepId, 'ARRAY', 'POINTS', elementName, 'Magnitude', 0, true];
    PV.colorElement(displayProps, asyncCallback);
};
/**
 * Specify Color Map to use.
 *
 * @param {string} paletteName - name of the color map as it appears in the file
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updatePalette = function updatePalette(paletteName, asyncCallback) {
    //console.log('setPalatteSyncable(), calling pv.color.manager.select.preset with param = ' + JSON.stringify(paletteOptions));
    var paletteOptions = [PV.activeRepId, paletteName];
    PV.session.call('pv.color.manager.select.preset', paletteOptions).then(function (result) {
        //console.log('color manager result = ' + JSON.stringify(result, null, 4));
        if (asyncCallback)
            asyncCallback(null, { success: true }); // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
    }, asyncCallback);
};
/**
 * Sets opacity of a specific element
 *
 * @param {number} elementRepId - representation id of the element
 * @param {number} opacity - 0 (fully transparent) to 1 (fully opaque)
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateElementOpacity = function updateElementOpacity(elementRepId, opacity, asyncCallback) {
    //    console.log('** Starting setElementOpacity()');
    var settings = {
        id: elementRepId,
        name: "Opacity",
        value: opacity
    };
    PV.elementSettings.push(settings);
    PV.elementOpacities[elementRepId] = opacity;
    PV._updateServerElements(asyncCallback);
};
/**
 * Sets opacity of last rendered element
 *
 * @param {number} opacity - 0 (fully transparent) to 1 (fully opaque)
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateOpacity = function updateOpacity(opacity, asyncCallback) {
    //    console.log('** Starting updateOpacity()');
    PV.updateElementOpacity(PV.activeRepId, opacity, asyncCallback);
};
/**
 * Add a filter to last rendered element
 *
 * @param {string} filterName - name of the filter, capitalized (e.g. `Tube`)
 * @param {Object} filterOpts - object literal with filter properties and values
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 * @example  PV.addFilter('Tube', {Radius: .05, NumberOfSides: 12});
 */
PV.addFilter = function addFilter(filterName, filterOpts, asyncCallback) {
    //console.log('** Starting addFilter(), activeFilterName = ' + filterName + ', PV.activeSourceId = ' + PV.activeSourceId);
    PV.session.call('pv.proxy.manager.create', [filterName, PV.activeElementId]).then(function (filterInfo) {
        //console.log('filterInfo = ' + JSON.stringify(filterInfo, null, 4));
        PV.filterProperties[filterInfo.id] = filterInfo.properties;
        PV.filterUI[filterInfo.id] = filterInfo.ui;
        PV.activeElementId = filterInfo.id;
        PV.activeRepId = filterInfo.rep;
        PV._saveServerElementInfo();
        PV.updateFilter(filterInfo.id, filterOpts, asyncCallback);
    });
};
PV._getFilterProperty = function getFilterProperty(propertyName) {
    //    console.log('** Starting getFilterProperty(), propertyName = ' + propertyName);
    var filterProperty = _.find(PV.filterProperties[PV.activeElementId], function (property) {
        return property.name === propertyName;
    });
    return filterProperty;
};
/**
 * Update the properties of a filter
 *
 * @param {number} filterId
 * @param {Object} filterOpts - object literal with filter properties and values
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateFilter = function modifyFilter(filterId, filterOpts, asyncCallback) {
    var settings = filterOpts || {};
    //console.log('** Starting modifyFilter(), filter settings = ' + JSON.stringify(settings));
    // TODO:  change this to use a map or something more efficient
    _.each(settings, function (settingValue, settingKey) {
        // first look in filterOpts returned from server
        var elementSetting = {
            id: 0,
            name: settingKey,
            value: settingValue
        };
        var property = PV._getFilterProperty(settingKey);
        elementSetting.id = property ? property.id : PV.activeElementId;
        if (elementSetting.name === 'GlyphSphereRadius') {
            elementSetting.id = PV.filterUI[PV.activeElementId][0].values.Sphere;
            elementSetting.name = 'Radius';
        }
        //console.log('Filter elementSetting = ' + JSON.stringify(elementSetting, null, 4));
        PV.elementSettings.push(elementSetting);
    });
    Meteor.setTimeout(function () {
        PV._updateServerElements(asyncCallback);
        //asyncCallback && asyncCallback(null, {success: true});
    }, 400);
};
PV._updateServerElements = function _updateServerElements(asyncCallback) {
    //console.log('** Starting _updateServerElementSettings(), PV.elementSettings = ' + JSON.stringify(PV.elementSettings, null, 4));
    PV.backgroundSetting.id = PV.activeViewId;
    PV.elementSettings.push(PV.backgroundSetting);
    PV.session.call('pv.proxy.manager.update', [PV.elementSettings]).then(function (result) {
        PV.viewport.invalidateScene();
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
PV._findLeafElement = function _findLeafElement(elementId) {
    //    console.log('findLeafElement(), elementId = ' + elementId);
    var elementInfo = _.find(PV.elements.get(), function (element) {
        return element.parent === elementId;
    });
    // if child found, first try to return another child if found and otherwise return the current child
    if (elementInfo)
        return elementInfo || PV._findLeafElement(elementInfo.id);
    // only reaches here for case of no children found
    elementInfo = _.find(PV.elements.get(), function (element) {
        return element.id === elementId;
    });
    return elementInfo;
};
PV._filePathToLeafElement = function _filePathToLeafElement(filePath) {
    var elementId = PV.fileElementIdMap[filePath];
    if (!elementId) {
        console.log('Could not find filePath: ' + filePath);
        return null;
    }
    return PV._findLeafElement(elementId);
};
/**
 * Show or hide an element
 *
 * @param {number} elementRepId
 * @param {boolean} isVisible
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateElementVisibility = function updateElementVisibility(elementRepId, isVisible, asyncCallback) {
    var elementSetting = {
        id: elementRepId || PV.activeRepId,
        name: 'Visibility',
        value: Number(isVisible)
    };
    //console.log('setElementVisibility(), elementSetting = ' + JSON.stringify(elementSetting, null, 4));
    PV.elementSettings.push(elementSetting);
    PV._updateServerElements(asyncCallback);
};
/**
 * Show the element (if it is hidden).
 *
 * @param {number} elementRepId - representation ID of the element
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showElement = function (elementRepId, asyncCallback) {
    //    console.log('** Starting showElement()');
    PV.updateElementVisibility(elementRepId, true, asyncCallback);
};
/**
 * Hide the element with the given file path.
 *
 * @param {string} filePath -- a file path that was previously an argument for `PV.addFile()`
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showElementByFilePath = function showElementByFilePath(filePath, asyncCallback) {
    var leafElement = PV._filePathToLeafElement(filePath);
    //    console.log('showElementByFilePath(), leafElement = ' + JSON.stringify(leafElement));
    PV.showElement(leafElement.rep, asyncCallback);
};
/**
 * Hide the element (if it is showing)
 *
 * @param {number} elementRepId - representation ID of the element
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hideElement = function hideElement(elementRepId, asyncCallback) {
    //    console.log('** Starting hideElement()');
    PV.updateElementVisibility(elementRepId, false, asyncCallback);
};
/**
 * Show the element with the given file path.
 *
 * @param {string} filePath -- a file path that was previously an argument for `PV.addFile()`
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hideElementByFilePath = function hideElementByFilePath(filePath, asyncCallback) {
    var leafElement = PV._filePathToLeafElement(filePath);
    //console.log('hideElementByFilePath(), leafElement = ' + JSON.stringify(leafElement));
    PV.hideElement(leafElement.rep, asyncCallback);
};
/**
 * Hide the last rendered element.
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.hide = function hide(asyncCallback) {
    //console.log('** Starting hide(), PV.activeRepId = ' + PV.activeRepId);
    PV.hideElement(PV.activeRepId, asyncCallback);
};
/**
 * Change how the surfaces appear for the last rendered element.
 *
 * @param {string} representationName - name of the representation.  Choices are "Surface", "SurfaceWithEdges". etc.
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.changeRepresentation = function changeRepresentation(representationName, asyncCallback) {
    //    console.log('** Starting updateRepresentation');
    var settings = {
        id: PV.activeRepId,
        name: "Representation",
        value: representationName
    };
    PV.elementSettings.push(settings);
    PV._updateServerElements(asyncCallback);
};
/**
 * Change some aspect of a video.
 *
 * @param {Object} vcrOptions
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
// options.vcrAction can be 'first', 'prev', 'next' or 'last'
PV.alterVideo = function alterVideo(vcrOptions, asyncCallback) {
    //    console.log('ShowFrameSyncable, calling pv.vcr.action with param = ' + JSON.stringify(vcrOptions));
    PV.session.call('pv.vcr.action', vcrOptions).then(function (timeValue) {
        //        console.log('pv.vcr.action success, set timeValue result = ' + timeValue);
        asyncCallback && asyncCallback(null, { success: true, lastFrameTime: timeValue });
    }, asyncCallback);
};
/**
 * Show the first frame of a video
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showFirstFrame = function showFirstFrame(asyncCallback) {
    //    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['first'], asyncCallback);
};
/**
 * Show the last frame of a video
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.showLastFrame = function showLastFrame(asyncCallback) {
    //    console.log('** Starting showLastFrameSyncable');
    PV.alterVideo(['last'], asyncCallback);
};
/**
 * Play the last rendered video and stop play when it finishes
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.playStopEnd = function playStopEnd(asyncCallback) {
    //    console.log('** Starting playStopEndSyncable()');
    asyncCallback && asyncCallback(null, { success: true }); // Should not block
    PV.paused = false;
    PV.showLastFrame(function (error, result) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function (error, result) {
            var runAnimationLoop = function () {
                PV.session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                    if (timeValue === lastFrameTime)
                        PV.paused = true;
                    PV.viewport.invalidateScene();
                    if (!PV.paused) {
                        setTimeout(runAnimationLoop, 25);
                    }
                });
            };
            Meteor.setTimeout(runAnimationLoop, 10);
        });
    });
};
/**
 * Play the last rendered video and repeat when it finishes
 *
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.playRepeat = function playRepeat(asyncCallback) {
    //    console.log('** Starting playSyncable()');
    asyncCallback && asyncCallback(null, { success: true }); // Should not block
    PV.paused = false;
    PV.showLastFrame(function (error, result) {
        var lastFrameTime = result.lastFrameTime;
        console.log('lastFrameTime = ' + lastFrameTime);
        PV.showFirstFrame(function (error, result) {
            var runAnimationLoop = function () {
                PV.session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                    Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                    PV.viewport.invalidateScene();
                    if (!PV.paused) {
                        setTimeout(runAnimationLoop, 25);
                    }
                });
            };
            Meteor.setTimeout(runAnimationLoop, 10);
        });
    });
};
/**
 * Rescale all measurements to fit the image.  Useful for videos.
 *
 * @param {requestCallback} asyncCallback - standard Node-style, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.rescale = function rescale(asyncCallback) {
    //    console.log('PVW.rescaleSyncable(), calling pv.color.manager.rescale.transfer.function with param = ' + JSON.stringify([{elementId: PVW.activeSourceId, type:"data"}]));
    PV.session.call('pv.color.manager.rescale.transfer.function', [{ proxyId: PV.activeElementId, type: "data" }]).then(function (result) {
        //        console.log('pv.color.manager.rescale.transfer.function success, set result = ' + JSON.stringify(result));
        asyncCallback && asyncCallback(null, { success: true });
    }, asyncCallback);
};
/**
 * Change the perspective of the viewer relative to the view.  Can zoom in, zoom out, change vantage points and focal points
 *
 * @param {Object} opts
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateCamera = function (opts, asyncCallback) {
    //console.log('updateCamera, opts = ' + JSON.stringify([Number(PVW.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]));
    if (!PV.session) {
        asyncCallback && asyncCallback(null, { success: true });
        return;
    }
    PV.session.call('viewport.camera.update', [Number(PV.activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]).then(function (result) {
        //console.log('result = ' + JSON.stringify(result));
        PV.render(null, null, asyncCallback);
    });
};
/**
 * Show or hide the Orientation Axes
 *
 * @param {boolean} isVisible
 * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateOrientationAxesVisibility = function updateOrientationAxesVisibility(isVisible, asyncCallback) {
    //console.log('updateOrientationAxesVisibility()');
    var elementSetting = {
        id: PV.activeViewId,
        value: Number(isVisible),
        name: "OrientationAxesVisibility"
    };
    PV.session.call('pv.proxy.manager.update', [[elementSetting]]).then(function (result) {
        PV.viewport.invalidateScene();
    });
};
/**
 * Show or hide the Center Axes
 *
 * @param isVisible
 * @param {requestCallback} [asyncCallback] - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.updateCenterAxesVisibility = function updateCenterAxesVisibility(isVisible, asyncCallback) {
    //console.log('updateOrientationAxesVisibility()');
    var elementSetting = {
        id: PV.activeViewId,
        value: Number(isVisible),
        name: "CenterAxesVisibility"
    };
    PV.session.call('pv.proxy.manager.update', [[elementSetting]]).then(function (result) {
        PV.viewport.invalidateScene();
    });
};
/**
 * Get some details about an element
 *
 * @param {number} elementId
 * @param {requestCallback} [asyncCallback] - optional, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
 */
PV.getElementFromServer = function getElementFromServer(elementId, asyncCallback) {
    PV.session.call('pv.proxy.manager.get', [elementId]).then(function (result) {
        //console.log('Stringified, pv.proxy.manager.get results = ' + JSON.stringify(result, null, 4));
        asyncCallback && asyncCallback(null, { success: true });
    });
};
PV.getOpacity = function getOpacity(elementRepId, asyncCallback) {
    PV.session.call('pv.color.manager.surface.opacity.get', [elementRepId]).then(function (result) {
        console.log('opacity elementRepId = ' + elementRepId);
        console.log('Stringified, pv.color.manager.surface.opacity results = ' + JSON.stringify(result, null, 4));
        asyncCallback && asyncCallback(null, { success: true });
    });
};
/**
 * Print all elements (a.k.a. proxies) on the server for debugging
 */
PV.printServerElements = function printServerElements() {
    PV.session.call('pv.proxy.manager.list').then(function (result) {
        var newResult = JSON.parse(JSON.stringify(result));
        newResult.sources = _.sortBy(result.sources, function (proxy) {
            return proxy.id;
        });
        console.log('pv.proxy.manager.list result = ' + JSON.stringify(newResult, null, 4));
    });
};
//# sourceMappingURL=paraview.js.map