### Overview
[ParaView](http://www.paraview.org/) is a is an open-source, multi-platform data analysis and visualization application.  This package provides a user-friendly wrapper for the (poorly documented) [ParaViewWeb JavaScript API](http://www.paraview.org/ParaView3/Doc/Nightly/www/js-doc/index.html#!/api).

It enables rendering and manipulation of visualizations that are in file formats supported by ParaView.
  
Assumptions:

- You have a ParaView server running that is accessible via WebGL to your browser
- The ParaView server has file access (via relative directory paths) to any artifacts (e.g. `*.vtk`, `*.pvd`, etc) files that you want to display.  There are 
 
### API



### Implementation

To avoid callback hell, it's recommended that you use some sort of aysnchronous call helper.  `Meteor.wrapAsync` will not work on the client, but there are several other packages readily available on atmosphere:

- PowerQueue
- queue.js
- Async


 
### Future Plans
- Customizable UI components that provide out-of-the box functionality


### Contributions
Contributions are welcome!   Please fork the code and submit a pull request.