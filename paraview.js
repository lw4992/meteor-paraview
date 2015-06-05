/// <reference path='../../../meteor-client-app/app/.typescript/package_defs/all-definitions.d.ts' />
/// <reference path='../../../meteor-client-app/app/.typescript/custom_defs/all-custom-definitions.d.ts' />
var connectionComputation;
// Use Revealing Module pattern to separate private and public members/methods.
// All public members/methods are at the bottom.
PV = (function () {
    /**
     *  @module PV
     */
    // These vars are not really public, but they are made public in the return
    // Same naming convention used for functions, even though all are really private within the closure
    var elements = new ReactiveVar([]), elementOpacities = {}, serverSessionManagerUrl = '', serverSessionUrl = '', scalarBar = new ReactiveVar({
        display: false,
        areDiscreteValues: false,
        labelsAndColors: []
    }), _session = null, _viewport = null, _paused = true, _lastFrameTime = 0, _currentFrameTime = 0, _filterProperties = {}, _filterUI = {}, _elementSettings = [], _lastMTime = 0, _activeViewId = -1, _mainElementId = 0, _activeElementId = 0, _activeRepId = 0, _fileElementIdMap = {}, _filesForRemoval = [], _viewportCssId = '#paraview-viewport', _activeColorArrayLocation = '', _activeColorArrayName = '', _backgroundSetting = {
        id: 0,
        value: [0.9765, 0.9765, 0.9765],
        name: "Background"
    };
    //setScalarBar = function (opts, asyncCallback?:iPVCallback) {
    //    //    console.log('** Starting setScalarBarSyncable, visibilityMap = ' + JSON.stringify(options.visibilityMap));
    //    PV._session.call('pv.color.manager.scalarbar.visibility.set', [options.visibilityMap]).then(function (result) {
    //        if (!options.noCallback) asyncCallback && asyncCallback(null, {success: true});  // Doesn't seem like this needs to block, but bad if a new element became last element before completion
    //    }, asyncCallback);
    //};
    //
    //removeScalarBar = function (sourceId, asyncCallback?:iPVCallback) {
    //    var scalarBarOptions = {
    //        visibilityMap: {}
    //    };
    //    scalarBarOptions.visibilityMap[sourceId] = false;
    //    PV.setScalarBar(scalarBarOptions, asyncCallback);
    //};
    //
    //removeAllScalarBars = function (asyncCallback?:iPVCallback) {
    //    //    console.log('** Starting removeAllScalarBarsSyncable()');
    //    if (!PV.proxies || PV.proxies.length === 0) return asyncCallback && asyncCallback(null, {success: true});
    //    _.each(PV.proxies, function (element, i) {
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
     * Set initial configurations for paraview, such as _viewportCssId or _backgroundSetting.
     *
     * @param {Object} opts - configuration options
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     * @example
     *         PV.config({
     *             serverSessionManagerUrl: 'http://localhost:9000/paraview',
     *             _viewportCssId: '#paraview-viewport',
     *             _backgroundSetting: {
     *                 value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
     *                 name: "Background"
     *         });
     */
    var config = function config(opts, asyncCallback) {
        //console.log('** Starting config(), configOpts = ' + JSON.stringify(opts, null, 4));
        serverSessionManagerUrl = opts.serverSessionManagerUrl;
        serverSessionUrl = opts.serverSessionUrl;
        _viewportCssId = opts.viewportCssId;
        _backgroundSetting = opts.backgroundSetting;
        asyncCallback && asyncCallback(null, { success: true });
    };
    /**
     * Remove all the elements from the server.
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var removeAllElements = function removeAllElements(asyncCallback) {
        //console.log('** Starting removeAllElements()');
        var numElements = elements.get().length;
        if (numElements === 0)
            asyncCallback(null, { success: true });
        var i = numElements;
        while (i--) {
            if (i === 0) {
                removeElement(JSON.parse(JSON.stringify(elements.get()[i].id)), asyncCallback);
            }
            else {
                removeElement(JSON.parse(JSON.stringify(elements.get()[i].id)), asyncCallback);
            }
        }
    };
    /**
     * Remove single element from the server
     *
     * @param {number} elementId - id of element to be removed
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var removeElement = function removeElement(elementId, asyncCallback) {
        //    console.log('** Starting removeElement()');
        _session.call('pv.proxy.manager.delete', [elementId]).then(function (result) {
            asyncCallback && asyncCallback(null, { success: true });
        }, asyncCallback);
    };
    var _connect = function connect() {
        Session.set('pvwConnected', false);
        var config = {
            // From client/lib/paraview/lib/core/vtkWebAll.js, which is set by Meteor.settings.public.paraview.sessionManagerURL
            sessionManagerURL: serverSessionManagerUrl,
            //sessionManagerURL: Meteor.settings['public']['paraview']['sessionManagerUrl'],
            //        sessionURL: vtkWeb.properties.sessionURL,  // Don't use so that sessionManagerURL is used
            application: "pipeline"
        };
        console.log('ParaView connection config = ' + JSON.stringify(config, null, 4));
        var stop = vtkWeb.NoOp;
        var start = function (connection) {
            //console.log('PV._connect(), connection._session = ' + JSON.stringify(connection._session, null, 4));
            _session = connection.session;
            // Update stop method to use the connection
            stop = function () {
                connection.session.call('vtk:exit');
                _session = null;
                Session.set('pvwInitialized', false);
                removeAllElements(function (error, result) {
                    if (error)
                        return _onError(error);
                });
            };
            Session.set('pvwConnected', true);
            //        console.log('ending start function, _session = ' + JSON.stringify(_session, null, 4));
        };
        vtkWeb.smartConnect(config, start, function (code, reason) {
            //$(".loading").hide();
            console.log('smartConnect() error, reason: ' + reason);
            _session = null;
            Session.set('pvwInitialized', false);
            removeAllElements(function (error, result) {
                if (error)
                    return _onError(error);
            });
        });
    };
    var _bindViewport = function _bindViewport(newSession) {
        //console.log('** Starting PV._bindViewport(), _viewportCssId = ' + _viewportCssId);
        //console.log('PV._bindViewport(), _session = ' + _session);
        var viewportOptions = {
            session: newSession || _session,
            view: -1,
            enableInteractions: true,
            renderer: 'image' //image or webgl
        };
        var newViewport = vtkWeb.createViewport(viewportOptions);
        newViewport.bind(_viewportCssId);
        _viewport = newViewport;
    };
    /**
     * Creates a _session with the ParaView _session if one does not exist already.  Reuses existing _session if one already exists.
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var initSession = function initSession(asyncCallback) {
        //console.log('** Starting initSession(), asyncCallback = ' + asyncCallback);
        if (!_session) {
            Session.set('pvwConnected', false);
            console.log('Creating connection and session with ParaView Server...');
            _connect();
            connectionComputation = Tracker.autorun(function () {
                var isConnected = Session.get('pvwConnected');
                if (isConnected) {
                    _bindViewport(); // I think all of this is synchronous
                    //                console.log('Completed initializeSyncable(), PV._session._wsuri = ' + PV._session._wsuri + ',  PV._session._session_id = ' + PV._session._session_id + ',  PV._session._websocket_connected = ' + PV._session._websocket_connected);
                    console.log('Created session with ParaView server, PV._session._id = ' + _session._id + ',  PV._session._socket.url = ' + _session._socket.url + ',  PV._session._socket.readyState = ' + _session._socket.readyState);
                    //console.log('PV._session = ' + JSON.stringify(PV._session, null, 4));
                    _saveServerElementInfo(asyncCallback);
                    //asyncCallback && asyncCallback(null, {success: true});
                    connectionComputation.stop();
                }
            });
        }
        else {
            console.log('Already connected to ParaView Server, reusing session');
            _bindViewport();
            _saveServerElementInfo(asyncCallback);
        }
    };
    var _onError = function _onError(error) {
        console.log('Error: ' + JSON.stringify(error));
    };
    // Given an array of elements, return the element with the given elementId
    var _getElement = function _getElement(elements, elementId) {
        var element = _.find(elements, function (element) {
            return element.id === elementId;
        });
        return element;
    };
    var _getRepId = function _getRepId(elements, elementId) {
        var element = _getElement(elements, elementId);
        return element && element.rep;
    };
    // Elements are returned by the paraview server in any order.  Save the element info in the order the elements were created.
    var _saveServerElementInfo = function _saveServerElementInfo(asyncCallback) {
        //    console.log('** Starting _saveServerElementInfo()');
        _session.call('pv.proxy.manager.list').then(function (result) {
            if (result && result.view)
                _activeViewId = result.view;
            //console.log('result.view = ' + result.view);
            if (result && result.sources && result.sources.length !== 0) {
                _activeElementId = _activeElementId || result.sources[result.sources.length - 1].id; // If calling for first time, make last element the active one
                _activeRepId = _getRepId(result.sources, _activeElementId);
                var resultElements = _.sortBy(result.sources, function (element) {
                    return element.id;
                });
                elements.set(resultElements);
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
    var addFile = function addFile(path, asyncCallback) {
        console.log('Starting addFile(), relativeFilePath = ' + path);
        _session.call("pv.proxy.manager.create.reader", [path]).then(function (reply) {
            //console.log('pv.proxy.manager.create.reader() reply = ' + JSON.stringify(reply));
            _mainElementId = reply.id;
            _activeElementId = reply.id;
            _fileElementIdMap[path] = reply.id;
            _saveServerElementInfo(asyncCallback);
        }, asyncCallback);
    };
    /**
     * Refresh the viewport with any changes to the server
     *
     * @param {number} width - optional width.  Default is width of element specified by _viewportCssId
     * @param {number} height - optional height.  Default is height of element specified by _viewportCssId
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var render = function render(width, height, asyncCallback) {
        //console.log('** Starting render(), width = ' + width);
        var width = width || $(_viewportCssId).innerWidth();
        var height = height || $(_viewportCssId).innerHeight();
        var renderCfg = {
            "size": [width, height],
            "view": _activeViewId,
            "mtime": _lastMTime,
            "quality": 100,
            "localTime": Date.now()
        };
        //console.log('rendering with viewport size = ' + renderCfg.size);
        _session.call("viewport.image.render", [renderCfg]).then(function (result) {
            //console.log('viewport.image.render result = ' + JSON.stringify(result, null, 4));
            _lastMTime = result.mtime;
            _viewport.invalidateScene();
            if (asyncCallback)
                asyncCallback(null, { success: true });
        });
    };
    /**
     * Recenter and rescale all visible visualizations.  Calls PV.render() to display changes.
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var resetViewport = function resetViewport(asyncCallback) {
        //console.log('** Starting resetViewPort(), PV._activeViewId = ' + PV._activeViewId);
        if (!_session) {
            asyncCallback && asyncCallback(null, { success: true });
            return;
        }
        //Session.get('graphicsViewportSize');  // sole purpose of this line is to enable this function to be reactive if wrapped in a Deps.autorun, so a viewport size change will trigger this function again.
        _session.call("viewport.camera.reset", [_activeViewId]).then(function (result) {
            //        console.log('viewport.camera.reset result = ' + JSON.stringify(result));
            render(null, null, asyncCallback);
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
    // A complete displayProps should look like [PV._activeRepId, colorMode, arrayLocation, arrayName, vectorMode, vectorComponent, rescale];
    var colorElement = function colorElement(colorOptsArray, asyncCallback) {
        //console.log('colorElement(), colorOptsArray = ' + JSON.stringify(colorOptsArray, null, 4));
        _session.call('pv.color.manager.color.by', colorOptsArray).then(function () {
            asyncCallback && asyncCallback(null, { success: true }); // Doesn't seem like this needs to block, but \bad if a new layer became last layer before completion
        }, asyncCallback);
    };
    /**
     * Colors cells of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'CELLS', elementName])
     *
     * @param {string} elementName - name of layer, specified in visualization file
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var colorCells = function colorCells(elementName, asyncCallback) {
        colorElement([_activeRepId, 'ARRAY', 'CELLS', elementName, 'Magnitude', 0, false], asyncCallback);
    };
    /**
     * Colors points of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'POINTS', elementName, 'Magnitude', 0, true]) *
     *
     * @param {string} elementName - name of layer, specified in visualization file
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var colorPoints = function colorPoints(elementName, asyncCallback) {
        var displayProps = [_activeRepId, 'ARRAY', 'POINTS', elementName, 'Magnitude', 0, true];
        colorElement(displayProps, asyncCallback);
    };
    /**
     * Specify Color Map to use.
     *
     * @param {string} paletteName - name of the color map as it appears in the file
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var updatePalette = function updatePalette(paletteName, asyncCallback) {
        //console.log('setPalatteSyncable(), calling pv.color.manager.select.preset with param = ' + JSON.stringify(paletteOptions));
        var paletteOptions = [_activeRepId, paletteName];
        _session.call('pv.color.manager.select.preset', paletteOptions).then(function (result) {
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
    var updateElementOpacity = function updateElementOpacity(elementRepId, opacity, asyncCallback) {
        //    console.log('** Starting setElementOpacity()');
        var settings = {
            id: elementRepId,
            name: "Opacity",
            value: opacity
        };
        _elementSettings.push(settings);
        elementOpacities[elementRepId] = opacity;
        _updateServerElements(asyncCallback);
    };
    /**
     * Sets opacity of last rendered element
     *
     * @param {number} opacity - 0 (fully transparent) to 1 (fully opaque)
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var updateOpacity = function updateOpacity(opacity, asyncCallback) {
        //    console.log('** Starting updateOpacity()');
        updateElementOpacity(_activeRepId, opacity, asyncCallback);
    };
    /**
     * Add a filter to last rendered element
     *
     * @param {string} filterName - name of the filter, capitalized (e.g. `Tube`)
     * @param {Object} filterOpts - object literal with filter properties and values
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     * @example  PV.addFilter('Tube', {Radius: .05, NumberOfSides: 12});
     */
    var addFilter = function addFilter(filterName, filterOpts, asyncCallback) {
        //console.log('** Starting addFilter(), activeFilterName = ' + filterName + ', PV.activeSourceId = ' + PV.activeSourceId);
        _session.call('pv.proxy.manager.create', [filterName, _activeElementId]).then(function (filterInfo) {
            //console.log('filterInfo = ' + JSON.stringify(filterInfo, null, 4));
            _filterProperties[filterInfo.id] = filterInfo.properties;
            _filterUI[filterInfo.id] = filterInfo.ui;
            _activeElementId = filterInfo.id;
            _activeRepId = filterInfo.rep;
            _saveServerElementInfo();
            updateFilter(filterInfo.id, filterOpts, asyncCallback);
        });
    };
    var _getFilterProperty = function getFilterProperty(propertyName) {
        //    console.log('** Starting getFilterProperty(), propertyName = ' + propertyName);
        var filterProperty = _.find(_filterProperties[_activeElementId], function (property) {
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
    var updateFilter = function modifyFilter(filterId, filterOpts, asyncCallback) {
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
            var property = _getFilterProperty(settingKey);
            elementSetting.id = property ? property.id : _activeElementId;
            if (elementSetting.name === 'GlyphSphereRadius') {
                elementSetting.id = _filterUI[_activeElementId][0].values.Sphere;
                elementSetting.name = 'Radius';
            }
            //console.log('Filter elementSetting = ' + JSON.stringify(elementSetting, null, 4));
            _elementSettings.push(elementSetting);
        });
        Meteor.setTimeout(function () {
            _updateServerElements(asyncCallback);
            //asyncCallback && asyncCallback(null, {success: true});
        }, 400);
    };
    var _updateServerElements = function _updateServerElements(asyncCallback) {
        //console.log('** Starting _updateServerElementSettings(), PV._elementSettings = ' + JSON.stringify(PV._elementSettings, null, 4));
        _backgroundSetting.id = _activeViewId;
        _elementSettings.push(_backgroundSetting);
        _session.call('pv.proxy.manager.update', [_elementSettings]).then(function (result) {
            _viewport.invalidateScene();
            asyncCallback && asyncCallback(null, { success: true });
        }, asyncCallback);
    };
    var _findLeafElement = function _findLeafElement(elementId) {
        //    console.log('findLeafElement(), elementId = ' + elementId);
        var elementInfo = _.find(elements.get(), function (element) {
            return element.parent === elementId;
        });
        // if child found, first try to return another child if found and otherwise return the current child
        if (elementInfo)
            return elementInfo || _findLeafElement(elementInfo.id);
        // only reaches here for case of no children found
        elementInfo = _.find(elements.get(), function (element) {
            return element.id === elementId;
        });
        return elementInfo;
    };
    var _filePathToLeafElement = function _filePathToLeafElement(filePath) {
        var elementId = _fileElementIdMap[filePath];
        if (!elementId) {
            console.log('Could not find filePath: ' + filePath);
            return null;
        }
        return _findLeafElement(elementId);
    };
    /**
     * Show or hide an element
     *
     * @param {number} elementRepId
     * @param {boolean} isVisible
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var updateElementVisibility = function updateElementVisibility(elementRepId, isVisible, asyncCallback) {
        var elementSetting = {
            id: elementRepId || _activeRepId,
            name: 'Visibility',
            value: Number(isVisible)
        };
        //console.log('setElementVisibility(), elementSetting = ' + JSON.stringify(elementSetting, null, 4));
        _elementSettings.push(elementSetting);
        _updateServerElements(asyncCallback);
    };
    /**
     * Show the element (if it is hidden).
     *
     * @param {number} elementRepId - representation ID of the element
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var showElement = function (elementRepId, asyncCallback) {
        //    console.log('** Starting showElement()');
        updateElementVisibility(elementRepId, true, asyncCallback);
    };
    /**
     * Hide the element with the given file path.
     *
     * @param {string} filePath -- a file path that was previously an argument for `PV.addFile()`
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var showElementByFilePath = function showElementByFilePath(filePath, asyncCallback) {
        var leafElement = _filePathToLeafElement(filePath);
        //    console.log('showElementByFilePath(), leafElement = ' + JSON.stringify(leafElement));
        showElement(leafElement.rep, asyncCallback);
    };
    /**
     * Hide the element (if it is showing)
     *
     * @param {number} elementRepId - representation ID of the element
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var hideElement = function hideElement(elementRepId, asyncCallback) {
        //    console.log('** Starting hideElement()');
        updateElementVisibility(elementRepId, false, asyncCallback);
    };
    /**
     * Show the element with the given file path.
     *
     * @param {string} filePath -- a file path that was previously an argument for `PV.addFile()`
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var hideElementByFilePath = function hideElementByFilePath(filePath, asyncCallback) {
        var leafElement = _filePathToLeafElement(filePath);
        //console.log('hideElementByFilePath(), leafElement = ' + JSON.stringify(leafElement));
        hideElement(leafElement.rep, asyncCallback);
    };
    /**
     * Hide the last rendered element.
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var hide = function hide(asyncCallback) {
        //console.log('** Starting hide(), PV._activeRepId = ' + PV._activeRepId);
        hideElement(_activeRepId, asyncCallback);
    };
    /**
     * Change how the surfaces appear for the last rendered element.
     *
     * @param {string} representationName - name of the representation.  Choices are "Surface", "SurfaceWithEdges". etc.
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var changeRepresentation = function changeRepresentation(representationName, asyncCallback) {
        //    console.log('** Starting updateRepresentation');
        var settings = {
            id: _activeRepId,
            name: "Representation",
            value: representationName
        };
        _elementSettings.push(settings);
        _updateServerElements(asyncCallback);
    };
    /**
     * Change some aspect of a video.
     *
     * @param {Object} vcrOptions
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    // options.vcrAction can be 'first', 'prev', 'next' or 'last'
    var alterVideo = function alterVideo(vcrOptions, asyncCallback) {
        //    console.log('ShowFrameSyncable, calling pv.vcr.action with param = ' + JSON.stringify(vcrOptions));
        _session.call('pv.vcr.action', vcrOptions).then(function (timeValue) {
            //        console.log('pv.vcr.action success, set timeValue result = ' + timeValue);
            asyncCallback && asyncCallback(null, { success: true, lastFrameTime: timeValue });
        }, asyncCallback);
    };
    /**
     * Show the first frame of a video
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var showFirstFrame = function showFirstFrame(asyncCallback) {
        //    console.log('** Starting showLastFrameSyncable');
        alterVideo(['first'], asyncCallback);
    };
    /**
     * Show the last frame of a video
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var showLastFrame = function showLastFrame(asyncCallback) {
        //    console.log('** Starting showLastFrameSyncable');
        alterVideo(['last'], asyncCallback);
    };
    /**
     * Play the last rendered video and stop play when it finishes
     *
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var playStopEnd = function playStopEnd(asyncCallback) {
        //    console.log('** Starting playStopEndSyncable()');
        asyncCallback && asyncCallback(null, { success: true }); // Should not block
        _paused = false;
        showLastFrame(function (error, result) {
            var lastFrameTime = result.lastFrameTime;
            console.log('lastFrameTime = ' + lastFrameTime);
            showFirstFrame(function (error, result) {
                var runAnimationLoop = function () {
                    _session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                        Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                        if (timeValue === lastFrameTime)
                            _paused = true;
                        _viewport.invalidateScene();
                        if (!_paused) {
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
    var playRepeat = function playRepeat(asyncCallback) {
        //    console.log('** Starting playSyncable()');
        asyncCallback && asyncCallback(null, { success: true }); // Should not block
        _paused = false;
        showLastFrame(function (error, result) {
            var lastFrameTime = result.lastFrameTime;
            console.log('lastFrameTime = ' + lastFrameTime);
            showFirstFrame(function (error, result) {
                var runAnimationLoop = function () {
                    _session.call('pv.vcr.action', ['next']).then(function (timeValue) {
                        Session.set('sim.movieProgressPercent', Math.ceil(timeValue / lastFrameTime * 100));
                        _viewport.invalidateScene();
                        if (!_paused) {
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
    var rescale = function rescale(asyncCallback) {
        //    console.log('PVW.rescaleSyncable(), calling pv.color.manager.rescale.transfer.function with param = ' + JSON.stringify([{elementId: PVW.activeSourceId, type:"data"}]));
        _session.call('pv.color.manager.rescale.transfer.function', [{ proxyId: _activeElementId, type: "data" }]).then(function (result) {
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
    var updateCamera = function (opts, asyncCallback) {
        //console.log('updateCamera, opts = ' + JSON.stringify([Number(PVW._activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]));
        if (!_session) {
            asyncCallback && asyncCallback(null, { success: true });
            return;
        }
        _session.call('viewport.camera.update', [Number(_activeViewId), opts.focalPoint, opts.viewUp, opts.camPosition]).then(function (result) {
            //console.log('result = ' + JSON.stringify(result));
            render(null, null, asyncCallback);
        });
    };
    /**
     * Show or hide the Orientation Axes
     *
     * @param {boolean} isVisible
     * @param {requestCallback} asyncCallback - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var updateOrientationAxesVisibility = function updateOrientationAxesVisibility(isVisible, asyncCallback) {
        //console.log('updateOrientationAxesVisibility()');
        var elementSetting = {
            id: _activeViewId,
            value: Number(isVisible),
            name: "OrientationAxesVisibility"
        };
        _session.call('pv.proxy.manager.update', [[elementSetting]]).then(function (result) {
            _viewport.invalidateScene();
        });
    };
    /**
     * Show or hide the Center Axes
     *
     * @param isVisible
     * @param {requestCallback} [asyncCallback] - standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var updateCenterAxesVisibility = function updateCenterAxesVisibility(isVisible, asyncCallback) {
        //console.log('updateOrientationAxesVisibility()');
        var elementSetting = {
            id: _activeViewId,
            value: Number(isVisible),
            name: "CenterAxesVisibility"
        };
        _session.call('pv.proxy.manager.update', [[elementSetting]]).then(function (result) {
            _viewport.invalidateScene();
        });
    };
    /**
     * Get some details about an element
     *
     * @param {number} elementId
     * @param {requestCallback} [asyncCallback] - optional, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
     */
    var getElementFromServer = function getElementFromServer(elementId, asyncCallback) {
        _session.call('pv.proxy.manager.get', [elementId]).then(function (result) {
            //console.log('Stringified, pv.proxy.manager.get results = ' + JSON.stringify(result, null, 4));
            asyncCallback && asyncCallback(null, { success: true });
        });
    };
    var getOpacity = function getOpacity(elementRepId, asyncCallback) {
        _session.call('pv.color.manager.surface.opacity.get', [elementRepId]).then(function (result) {
            console.log('opacity elementRepId = ' + elementRepId);
            console.log('Stringified, pv.color.manager.surface.opacity results = ' + JSON.stringify(result, null, 4));
            asyncCallback && asyncCallback(null, { success: true });
        });
    };
    /**
     * Print all elements (a.k.a. proxies) on the server.  Helpful for debugging.
     */
    var printServerElements = function printServerElements() {
        _session.call('pv.proxy.manager.list').then(function (result) {
            var newResult = JSON.parse(JSON.stringify(result));
            newResult.sources = _.sortBy(result.sources, function (proxy) {
                return proxy.id;
            });
            console.log('pv.proxy.manager.list result = ' + JSON.stringify(newResult, null, 4));
        });
    };
    var getServerSessionUrl = function getServerSessionUrl() {
        return serverSessionUrl;
    };
    var getServerSessionManagerUrl = function getServerSessionManagerUrl() {
        return serverSessionManagerUrl;
    };
    var isConnected = function isConnected() {
        return !!_session;
    };
    // public API
    return {
        // public member vars
        elements: elements,
        elementOpacities: elementOpacities,
        scalarBar: scalarBar,
        serverSessionUrl: serverSessionUrl,
        serverSessionManagerUrl: serverSessionManagerUrl,
        // Not sure why can only connect using getters -- maybe if vtkweb-all gets loaded before this file?
        getServerSessionUrl: getServerSessionUrl,
        getServerSessionManagerUrl: getServerSessionManagerUrl,
        // public methods
        config: config,
        resetViewport: resetViewport,
        render: render,
        printServerElements: printServerElements,
        addFile: addFile,
        colorElement: colorElement,
        colorCells: colorCells,
        colorPoints: colorPoints,
        updatePalette: updatePalette,
        updateElementOpacity: updateElementOpacity,
        getOpacity: getOpacity,
        updateOpacity: updateOpacity,
        addFilter: addFilter,
        updateFilter: updateFilter,
        changeRepresentation: changeRepresentation,
        removeAllElements: removeAllElements,
        removeElement: removeElement,
        initSession: initSession,
        hide: hide,
        hideElement: hideElement,
        hideElementByFilePath: hideElementByFilePath,
        showElement: showElement,
        showElementByFilePath: showElementByFilePath,
        updateElementVisibility: updateElementVisibility,
        //setScalarBar: setScalarBar,
        //removeScalarBar: removeScalarBar,
        //removeAllScalarBars: removeAllScalarBars,
        alterVideo: alterVideo,
        showFirstFrame: showFirstFrame,
        showLastFrame: showLastFrame,
        playStopEnd: playStopEnd,
        playRepeat: playRepeat,
        rescale: rescale,
        updateCamera: updateCamera,
        updateOrientationAxesVisibility: updateOrientationAxesVisibility,
        updateCenterAxesVisibility: updateCenterAxesVisibility,
        getElementFromServer: getElementFromServer,
        isConnected: isConnected
    };
}());
//# sourceMappingURL=paraview.js.map