Package.describe({
    name: 'fullflavedave:paraview',
    version: '0.1.9',
    summary: 'A user-friendly wrapper for the ParaViewWeb JavaScript API',
    git: 'https://github.com/fullflavedave/meteor-paraview.git',
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.2.1');
    api.use('accounts-base', 'client');
    api.use(['ecmascript@0.1.6', 'mongo', 'mongo-livedata'], ['client', 'server']);
    api.use(['templating', 'minimongo'], 'client');
    api.use('jquery', 'client');
    api.use('reactive-var', 'client');
    api.use('runelytics:nouislider@8.0.2', 'client');
    api.use('fullflavedave:taskq@0.1.2', 'client');
    api.use('raix:handlebar-helpers@0.2.5', 'client');
    api.use('sacha:spin@2.3.1', 'client');

    api.addFiles('paraview.js', 'client');

    // Files copied (and tweaked) from ParaViewWeb
    api.addFiles([
        'lib/paraview_web/gl-matrix-min.js',
        'lib/paraview_web/hammer.min.js',
        'lib/paraview_web/jquery.hammer.min.js',
        'lib/paraview_web/autobahn.min.js',
        'lib/paraview_web/vtkweb-all.js'
    ], 'client');

    api.export(['vtkWeb'], 'client');
    api.export(['PV'], 'client');
    api.export('ParaviewSessions', ['client', 'server']);

    api.export('SimpleChat', 'client');
    api.export('SimpleChatMessages', ['client', 'server']);

    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.html', 'client');
    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.css', 'client');
    api.addFiles('templates/paraview_display/control_panel/paraview_control_panel.js', 'client');

    api.addFiles([
        'lib/collections.js',
        'lib/methods.js'
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
        'templates/paraview_display/scalarbar/paraview_scalarbar.html',
        'templates/paraview_display/scalarbar/paraview_scalarbar.js',
        'templates/paraview_display/loading/paraview_loading.html',
        'templates/paraview_display/loading/paraview_loading.css',
        'templates/paraview_display/shared_session_controls/paraview_shared_session_controls.html',
        'templates/paraview_display/shared_session_controls/paraview_shared_session_controls.js'
    ], 'client');

    // For shared console
    api.addFiles([
        'templates/paraview_display/shared_session_controls/shared_console/paraview_shared_console.html',
        'templates/paraview_display/shared_session_controls/shared_console/paraview_shared_console.js'
    ], 'client');

    // For simpleChat, eventually split into separate package
    api.use('momentjs:moment@2.10.6', 'client');
    api.use('mizzao:jquery-ui@1.11.4', 'client');

    api.addFiles([
        'templates/paraview_display/shared_session_controls/chat/simple_chat_panel.html',
        'templates/paraview_display/shared_session_controls/chat/simple_chat_panel.js',
        'templates/paraview_display/shared_session_controls/chat/simple_chat_panel.css',
        'templates/paraview_display/shared_session_controls/chat/simple_chat.js'
    ], 'client');

});

Package.onTest(function (api) {
    api.use('tinytest');
    api.use('fullflavedave:paraview');
    api.addFiles('paraview-tests.js', 'client');
});
