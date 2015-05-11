## Under Development
Disclaimer:  this package is currently under heavy development and undoubtedly contains many bugs.  Contributions are welcome.

## ParaView
[ParaView](http://www.paraview.org/) is a is an open-source, multi-platform data analysis and visualization application.  This package provides a user-friendly wrapper for the [ParaViewWeb JavaScript API](http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api).

It enables rendering and manipulation of visualizations that are in file formats supported by ParaView.  You basically:

- connect to a ParaView Server
- specify a file or files (accessible from the ParaViewServer) to load
- Add filters and display options to alter the file rendering(s)
  
Assumptions:

- You have a ParaView server running that is accessible via WebGL from your browser
- The ParaView server has file access (via relative directory paths) to any artifacts (e.g. `*.vtk`, `*.pvd`, etc) files that you want to display.
 
## Quick Start

Set the required configuration properties, initialize a session, and add a file:
 
    var configOpts = {
        serverSessionManagerUrl: 'http://localhost:9000/paraview',
        viewportCSSId: '#paraview-viewport',
        backgroundSetting: {
            value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
            name: "Background"
        }
    };
    
    TaskQ
        .defer(PV.config, configOpts)
        .defer(PV.initSession)
        .defer(PV.addFile, currentJob._id + '/' + Meteor.settings['public']['filePaths']['lithologyMesh']) 
        .awaitAll();

 
 
## Terminology and Structure
- "View" - the space in which the visualization appears
- "Element" - an artifact that produces a separate visual object (can hide or show it)
    - An element is equivalent to a "proxy" in the ParaViewWeb API, a term that doesn't make much sense for most client-side developers
    - Elements can be file renderings or filters
    - Elements have properties that determine how they are displayed
    - Elements can be have an id and a representation id
- "Filter" - an element that is the result of the manipulation of the visual data of another element
    - a filter applied to a file rendering or another filter

## JSDocs API


### PV.config(opts, asyncCallback) 
- **Description**: Set initial configurations for paraview, such as viewportCssId or backgroundSetting.
- **Parameters**
    - **opts**: `Object` -- configuration options
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
- **Example**:

		PV.config({
            serverSessionManagerUrl: 'http://localhost:9000/paraview',
            viewportCSSId: '#paraview-viewport',
            backgroundSetting: {
                value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
                name: "Background"
        });


### PV.removeAllElements(asyncCallback) 
- **Description**: Remove all the elements from the server.
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.removeElement(elementId, asyncCallback) 
- **Description**: Remove single element from the server
- **Parameters**
    - **elementId**: `number` -- id of element to be removed
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.initSession(asyncCallback) 
- **Description**: Creates a session with the ParaView session if one does not exist already.  Reuses existing session if one already exists.
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.addFile(path, asyncCallback) 
- **Description**: Render a file, which should be accessible by the ParaView server.
- **Parameters**
    - **path**:  -- Render a file, which should be accessible by the ParaView server.
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.render(width, height, asyncCallback) 
- **Description**: Refresh the viewport with any changes to the server
- **Parameters**
    - **width**: `number` -- optional width.  Default is width of element specified by viewportCssId
    - **height**: `number` -- optional height.  Default is height of element specified by viewportCssId
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.resetViewport(asyncCallback) 
- **Description**: Recenter and rescale all visible visualizations.  Calls PV.render() to display changes.
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.colorElement(colorOptsArray, asyncCallback) 
- **Description**: Color an element (proxy).  Called by PV.colorCells() and PV.colorPoints().
- **Parameters**
    - **colorOptsArray**: `Array` -- tells server how to color the element
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
- **Example**:

		colorOptsArray has this format:

        [
            elementRepId: string,    // required
            colorMode: string,       // required, "SOLID" or "ARRAY"
            arrayLocation: string,   // optional, string, "POINTS" or "CELLS", defaults to "POINTS"
            arrayName: string,       // optional, string, defaults to ""
            vectorMode: string       // optional, string, defaults to "Magnitude"
            vectorComponent?: number // optional, number, defaults to 0
            rescale: boolean         // optional, boolean, defaults to false
        ]


### PV.colorCells(elementName, asyncCallback) 
- **Description**: Colors cells of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'CELLS', elementName])
- **Parameters**
    - **elementName**: `string` -- name of layer, specified in visualization file
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.colorPoints(elementName, asyncCallback) 
- **Description**: Colors points of a visualization.  Calls colorElement([<activRepId>, 'ARRAY', 'POINTS', elementName, 'Magnitude', 0, true]) *
- **Parameters**
    - **elementName**: `string` -- name of layer, specified in visualization file
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updatePalette(paletteName, asyncCallback) 
- **Description**: Specify Color Map to use.
- **Parameters**
    - **paletteName**: `string` -- name of the color map as it appears in the file
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateElementOpacity(elementRepId, opacity, asyncCallback) 
- **Description**: Sets opacity of a specific element
- **Parameters**
    - **elementRepId**: `number` -- representation id of the element
    - **opacity**: `number` -- 0 (fully transparent) to 1 (fully opaque)
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateOpacity(opacity, asyncCallback) 
- **Description**: Sets opacity of last rendered element
- **Parameters**
    - **opacity**: `number` -- 0 (fully transparent) to 1 (fully opaque)
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.addFilter(filterName, filterOpts, asyncCallback) 
- **Description**: Add a filter to last rendered element
- **Parameters**
    - **filterName**: `string` -- name of the filter, capitalized (e.g. `Tube`)
    - **filterOpts**: `Object` -- object literal with filter properties and values
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`
- **Example**:

		PV.addFilter('Tube', {Radius: .05, NumberOfSides: 12});


### PV.updateFilter(filterId, filterOpts, asyncCallback) 
- **Description**: Update the properties of a filter
- **Parameters**
    - **filterId**: `number` -- Update the properties of a filter
    - **filterOpts**: `Object` -- object literal with filter properties and values
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateElementVisibility(elementRepId, isVisible, asyncCallback) 
- **Description**: Show or hide an element
- **Parameters**
    - **elementRepId**: `number` -- Show or hide an element
    - **isVisible**: `boolean` -- Show or hide an element
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.showElement(elementRepId, asyncCallback) 
- **Description**: Show the element (if it is hidden).
- **Parameters**
    - **elementRepId**: `number` -- representation ID of the element
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.showElementByFilePath(filePath, asyncCallback) 
- **Description**: Hide the element with the given file path.
- **Parameters**
    - **filePath**: `string` -- - a file path that was previously an argument for `PV.addFile()`
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.hideElement(elementRepId, asyncCallback) 
- **Description**: Hide the element (if it is showing)
- **Parameters**
    - **elementRepId**: `number` -- representation ID of the element
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.hideElementByFilePath(filePath, asyncCallback) 
- **Description**: Show the element with the given file path.
- **Parameters**
    - **filePath**: `string` -- - a file path that was previously an argument for `PV.addFile()`
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.hide(asyncCallback) 
- **Description**: Hide the last rendered element.
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.changeRepresentation(representationName, asyncCallback) 
- **Description**: Change how the surfaces appear for the last rendered element.
- **Parameters**
    - **representationName**: `string` -- name of the representation.  Choices are "Surface", "SurfaceWithEdges". etc.
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.alterVideo(vcrOptions, asyncCallback) 
- **Description**: Change some aspect of a video.
- **Parameters**
    - **vcrOptions**: `Object` -- Change some aspect of a video.
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.showFirstFrame(asyncCallback) 
- **Description**: Show the first frame of a video
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.showLastFrame(asyncCallback) 
- **Description**: Show the last frame of a video
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.playStopEnd(asyncCallback) 
- **Description**: Play the last rendered video and stop play when it finishes
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.playRepeat(asyncCallback) 
- **Description**: Play the last rendered video and repeat when it finishes
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.rescale(asyncCallback) 
- **Description**: Rescale all measurements to fit the image.  Useful for videos.
- **Parameters**
    - **asyncCallback**: `requestCallback` -- standard Node-style, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateCamera(opts, asyncCallback) 
- **Description**: Change the perspective of the viewer relative to the view.  Can zoom in, zoom out, change vantage points and focal points
- **Parameters**
    - **opts**: `Object` -- Change the perspective of the viewer relative to the view.  Can zoom in, zoom out, change vantage points and focal points
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateOrientationAxesVisibility(isVisible, asyncCallback) 
- **Description**: Show or hide the Orientation Axes
- **Parameters**
    - **isVisible**: `boolean` -- Show or hide the Orientation Axes
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.updateCenterAxesVisibility(isVisible, asyncCallback) 
- **Description**: Show or hide the Center Axes
- **Parameters**
    - **isVisible**:  -- Show or hide the Center Axes
    - **asyncCallback**: `requestCallback` -- standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.getElementFromServer(elementId, asyncCallback) 
- **Description**: Get some details about an element
- **Parameters**
    - **elementId**: `number` -- Get some details about an element
    - **asyncCallback**: `requestCallback` -- optional, standard Node-style callback, executed upon completion, has signature `function(error: Object, success: Object)`


### PV.printServerElements() 
- **Description**: Print all elements (a.k.a. proxies) on the server for debugging




## Implementation

### Async helper
To avoid callback hell, it's recommended that you use some sort of aysnchronous call helper.  `Meteor.wrapAsync` will not work on the client.  Here are several other packages readily available on atmosphere:

- [PowerQueue](https://atmospherejs.com/cfs/power-queue)
- Mike Bostock's [queue-async](https://atmospherejs.com/vsivsi/queue-async)
- [Async.js](https://atmospherejs.com/peerlibrary/async)

### Examples

    var configOpts = {
    serverSessionManagerUrl: 'http://localhost:9000/paraview',
    viewportCSSId: '#paraview-viewport',
        backgroundSetting: {
            value: [0.9765, 0.9765, 0.9765],  // Equivalent to RGB color #f9f9f9
            name: "Background"
        }
    };
    
### Templates

#### paraviewControlPanel
This template lists different files and filters added, enables you to show/hide each one or change each one's opacity.  It is implemented within a bootstrap panel that is as wide as it's containing element.

You can include the control panel in templates with this spacebars snippet:
    
    {{> paraviewControlPanel}}

It hasn't yet been created in a way that is easy to customize the style.

 
## Future Plans
- More UI components that provide out-of-the box functionality


## Contributions
Contributions are welcome!   Please fork the code and submit a pull request.