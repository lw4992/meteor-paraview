Package.describe({
    name: 'fullflavedave:paraview',
    version: '0.1.2',
    summary: 'A user-friendly wrapper for the ParaViewWeb JavaScript API',
    git: 'https://github.com/fullflavedave/meteor-paraview.git',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.2');
    api.use('templating', 'client');
    api.use('jquery', 'client');
    api.use('reactive-var', 'client');
    api.use('runelytics:nouislider@8.0.2', 'client');
    //api.use('rcy:nouislider@7.0.7_2', 'client');
    api.use('fullflavedave:taskq@0.1.1', 'client');
    api.use('raix:handlebar-helpers@0.2.5', 'client');

    api.addFiles('paraview.js', 'client');

    api.addFiles([
        'lib/gl-matrix-min.js'
    ], 'client');
    api.addFiles('lib/hammer.min.js', 'client');
    api.addFiles('lib/jquery.hammer.min.js', 'client');
    api.addFiles('lib/autobahn.min.js', 'client');
    api.addFiles('lib/vtkweb-all.js', 'client');

    api.export(['vtkWeb'], 'client');
    api.export(['PV'], 'client');

    api.addFiles('templates/control_panel/paraview_control_panel.html', 'client');
    api.addFiles('templates/control_panel/paraview_control_panel.css', 'client');
    api.addFiles('templates/control_panel/paraview_control_panel.js', 'client');

    api.addFiles([
        'templates/paraview_viewport/paraview_viewport.html',
        'templates/paraview_viewport/paraview_viewport.css',
        'templates/paraview_viewport/movie_progress_bar/paraview_movie_progress.html',
        'templates/paraview_viewport/movie_progress_bar/paraview_movie_progress.css',
        'templates/paraview_viewport/paraview_scalarbar/paraview_scalarbar.html',
        'templates/paraview_viewport/paraview_scalarbar/paraview_scalarbar.js',
        'templates/paraview_viewport/paraview_shared_session_controls/paraview_shared_session_controls.html',
        'templates/paraview_viewport/paraview_shared_session_controls/paraview_shared_session_controls.js'
    ], 'client')

});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('fullflavedave:paraview');
    api.addFiles('paraview-tests.js', 'client');
});
