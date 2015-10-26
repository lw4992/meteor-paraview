Package.describe({
    name: 'fullflavedave:paraview',
    version: '0.1.2',
    summary: 'A user-friendly wrapper for the ParaViewWeb JavaScript API',
    git: 'https://github.com/fullflavedave/meteor-paraview.git',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.1.0.2');
    api.use('accounts-base', 'client');
    api.use(['mongo', 'mongo-livedata'], ['client', 'server']);
    api.use(['templating', 'minimongo'], 'client');
    api.use('jquery', 'client');
    api.use('reactive-var', 'client');
    api.use('runelytics:nouislider@8.0.2', 'client');
    api.use('fullflavedave:taskq@0.1.1', 'client');
    api.use('raix:handlebar-helpers@0.2.5', 'client');
    //api.use('differential:event-hooks@1.5.0', ['client', 'server']);

    api.addFiles('paraview.js', 'client');

    // Files copied (and tweaked) from ParaViewWeb
    api.addFiles([
        'lib/gl-matrix-min.js',
        'lib/hammer.min.js',
        'lib/jquery.hammer.min.js',
        'lib/autobahn.min.js',
        'lib/vtkweb-all.js'
    ], 'client');

    api.export(['vtkWeb'], 'client');
    api.export(['PV'], 'client');
    api.export('ParaviewSettings', ['client', 'server']);

    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.html', 'client');
    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.css', 'client');
    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.js', 'client');

    api.addFiles([
        'lib/collections/paraview_settings.js'
    ], ['client', 'server']);

    api.addFiles([
        'server/publications.js',
        'server/startup.js'
    ], 'server');

    api.addFiles([
        'templates/paraview_display/paraview_display.html',
        'templates/paraview_display/paraview_display.css',
        'templates/paraview_display/movie_progress_bar/paraview_movie_progress.html',
        'templates/paraview_display/movie_progress_bar/paraview_movie_progress.css',
        'templates/paraview_display/paraview_scalarbar/paraview_scalarbar.html',
        'templates/paraview_display/paraview_scalarbar/paraview_scalarbar.js',
        'templates/paraview_display/paraview_shared_session_controls/paraview_shared_session_controls.html',
        'templates/paraview_display/paraview_shared_session_controls/paraview_shared_session_controls.js'
    ], 'client')

});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('fullflavedave:paraview');
    api.addFiles('paraview-tests.js', 'client');
});
