// Usage:
//      gulp - will execute rmAll, js, css tasks and exists.
//      gulp dev - will execute rmAll, js, css tasks('default'), launches browserSync
//                 which is proxying apache vhost(in my case, you can use static server instead).
//                 This mode will inject changed css files in dev mode and will reload browser on js file changes.
//      gulp --prod - will dump all js and css versioned files in production environment.

// Of course, you can use gulp-load-plugins instead all this requires.
var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');
var minifyCss = require('gulp-minify-css');
var util = require('gulp-util');
var gulpif = require('gulp-if');
var plumber = require('gulp-plumber');
var rev = require('gulp-rev');
var man = rev.manifest;
var uglify = require('gulp-uglify');
var del = require('del');
// Used for console command execution.
var exec = require('child_process').exec;
var Q = require('q');
var browserSync = require('browser-sync').create();

// Pipeline constructor receives 2 args:
//  onEnd callback will be called after last function end;(If passed)
//  callExec - if this param is true, console commands will be piped
//      instead of gulp plugin function calls. If some command finishes
//      with error, next commands are not being executed.
var Pipeline = function(onEnd, callExec) {
    this._args = [];
    this._onEnd = onEnd;
    this._callExec = callExec || false;
};
Pipeline.prototype.add = function(command) {
    if(!this._callExec)
        this._args.push(arguments);
    else
        this._args.push(command);
};
Pipeline.prototype.run = function(fn) {
    var deferred = Q.defer();
    var i = 0;
    var args = this._args;
    var callExec = this._callExec;
    var onEnd = this._onEnd;

    var runNextFn = function() {
        if(typeof args[i] === 'undefined') {
            deferred.resolve();
            // Call callback after last function end
            if(typeof onEnd == "function")
                onEnd();
            return;
        }

        // Execute next Gulp plugin function
        if(!callExec) {
            fn.apply(app, args[i]).on('end', function() {
                i++;
                runNextFn();
            });
        }
        // Execute next console command
        else {
            exec(args[i], function(err, stdout, stderr) {
                console.log(stdout, stderr);
                i++;

                if(!err)
                    runNextFn();
            });
        }
    };
    runNextFn();

    return deferred.promise;
};

var app = {
    buildCss: function(paths, outputFilename) {
        return gulp.src(paths)
            .pipe(gulpif(!c.prod, plumber()))
            .pipe(gulpif(!c.prod, sourcemaps.init()))
            .pipe(sass())
            .pipe(concat(outputFilename + ".css"))
            .pipe(c.prod ? minifyCss() : util.noop())
            // We want to use css file versions only on production
            .pipe(gulpif(c.prod, rev()))
            .pipe(gulpif(!c.prod, sourcemaps.write('.')))
            // Let's dump css manifest file only on production environment
            .pipe(c.prod ? gulp.dest(c.cssDest) : util.noop())
            .pipe(c.prod ? man(c.cssDest + '/' + c.revManifest, {merge: true}) : util.noop())
            // In dev mode we can't dump css file on line 86 and then call util.noop() in last
            // 2 pipes - in such case Gulp will execute buildCss only 1 time.(Next app.buildCss
            // will fail). Don't know why, but it looks like last pipe should always contain
            // gulp.dest call. So on line 86 I'm callind util.noop() and actually calling dest
            // here in dev mode.
            .pipe(c.prod ? gulp.dest('.') : gulp.dest(c.cssDest));
    },
    buildJs: function(paths, outputFilename) {
        return gulp.src(paths)
            .pipe(plumber())
            .pipe(gulpif(!c.prod, sourcemaps.init()))
            .pipe(concat(outputFilename + ".js"))
            .pipe(gulpif(c.prod, uglify()))
            // We want to use js file versions only on production
            .pipe(gulpif(c.prod, rev()))
            .pipe(gulpif(!c.prod, sourcemaps.write('.')))
            // Let's dump js manifest file only on production environment
            .pipe(c.prod ? gulp.dest(c.jsDest) : util.noop())
            .pipe(c.prod ? man(c.jsDest + '/' + c.revManifest, {merge: true}) : util.noop())
            // Same approach as in buildCss function
            .pipe(c.prod ? gulp.dest('.') : gulp.dest(c.jsDest));
    }
};

// c = Config
var c = {
    prod: (typeof util.env.prod != "undefined"),
    env: (typeof util.env.prod != "undefined") ? "prod" : "dev",
    bundles: {
        path: 'web/bundles/',
        // Client
        client: 'ntechclient/',
        clientJs: 'ntechclient/js/',
        clientCss: 'ntechclient/css/',
        // Admin
        admin: 'ntechadmin/',
        adminJs: 'ntechadmin/js/',
        adminCss: 'ntechadmin/css/',
        // Core
        core: 'ntechcore/',
        coreJs: 'ntechcore/js/',
        coreCss: 'ntechcore/css/',
        jsRouting: 'fosjsrouting/',
        jsRoutingJs: 'fosjsrouting/js/'
    },
    sassFull: '**/css/**/*.sass',
    sass: '**/*.sass',
    cssFull: '**/css/**/*.css',
    css: '**/*.css',
    jsFull: '**/js/**/*.js',
    js: '**/*.js',
    cssDest: 'web/css',
    jsDest: 'web/js',
    revManifest: 'rev-manifest.json'
};

// Shorthands for bundle assets
c.clientBundle = c.bundles.path + c.bundles.client;
c.clientBundleJs = c.bundles.path + c.bundles.clientJs;
c.clientBundleCss = c.bundles.path + c.bundles.clientCss;
c.adminBundle = c.bundles.path + c.bundles.admin;
c.adminBundleJs = c.bundles.path + c.bundles.adminJs;
c.adminBundleCss = c.bundles.path + c.bundles.adminCss;
c.coreBundle = c.bundles.path + c.bundles.core;
c.coreBundleJs = c.bundles.path + c.bundles.coreJs;
c.coreBundleCss = c.bundles.path + c.bundles.coreCss;
c.jsRoutingBundle = c.bundles.path + c.bundles.jsRouting;
c.jsRoutingBundleJs = c.bundles.path + c.bundles.jsRoutingJs;

gulp.task('css', function() {
    var pipe = new Pipeline(function() {
        // This callback will be executed after all buildCss function
        // finish. browserSync will not force full page reload - it 
        // will inject changed css files in dev-environment - this will
        // definetely speed up our development time!
        browserSync.reload('*.css');
    });

    // Core
    pipe.add([
        c.coreBundle + c.cssFull,
        c.coreBundle + c.sassFull
    ], 'core');

    // Client core
    pipe.add([c.clientBundleCss + "boot/" + c.sass], 'client-core');

    // Client views
    pipe.add(c.clientBundleCss + "views/aboutUs/" + c.sass, 'client-aboutus');
    // ... More views

    // More pipes for admin css...

    pipe.run(app.buildCss);
});

gulp.task('js', function() {
    var pipe = new Pipeline(function() {
        // Same approach for js files - the only difference that full page
        // reload will be trigger after js files dump in dev mode;
        browserSync.reload();
    });

    // Core
    pipe.add([
        c.coreBundleJs + c.js,
        // If you are using FosJsRouting bundle, here we are collecting
        // routes, which are dumped in custom location from our NtechExtension 
        // FosJsRoutingBundle Dump command. (Look at src/Ntech/NtechExtension/FosJsRoutingBundle)
        c.jsRoutingBundleJs + "router.js",
        // Include routes after router
        c.jsRoutingBundleJs + "routes.js"
    ], 'core');

    // Client core
    pipe.add([
        c.clientBundleJs + "vendor/" + c.js,
        c.clientBundleJs + "controller/" + c.js,
        c.clientBundleJs + "boot/" + c.js
    ], 'client-core');

    // Client views
    pipe.add(c.clientBundleJs + "views/aboutUs/" + c.js, 'client-aboutus');

    // Admin views here ....

    pipe.run(app.buildJs);
});

gulp.task('rmAll', function() {
    del.sync(c.cssDest + '/*');
    del.sync(c.jsDest + '/*');
});

gulp.task('default', ['rmAll', 'css', 'js']);

gulp.task('dev', ['default'], function() {
    // Initializing browserSync
    browserSync.init({
        // Proxying to apache vhost
        // (You can use static server instead)
        proxy: "local.lh",
        open: false
    });

    // On css changes - run css task and inject new Css files in browser
    gulp.watch([
        c.bundles.path + c.sassFull,
        c.bundles.path + c.cssFull
    ], ['css']);
    // On js changes - run js task and inject new Js files in browser
    gulp.watch([
        c.bundles.path + c.jsFull
    ], ['js']);
});

// You can also write some helper tasks, which will execute some
// console commands in order.
gulp.task('init', function() {
    var pipe = new Pipeline(null, true);

    pipe.add("php app/console cache:clear --env=" + c.env);
    pipe.add("php app/console assets:install --symlink");
    pipe.add("php app/console fos:js-routing:dump --env=" + c.env);
    pipe.add("php app/console doctrine:database:create");
    pipe.add("php app/console doctrine:schema:create");
    pipe.add("php app/console doctrine:fixtures:load");
    // ...

    pipe.run();
});

gulp.task('update', function() {
    var pipe = new Pipeline(null, true);

    pipe.add("php app/console cache:clear --env=" + c.env);
    pipe.add("php app/console assets:install --symlink");
    pipe.add("php app/console fos:js-routing:dump --env=" + c.env);
    pipe.add("php app/console doctrine:schema:update --force");
    // ...

    pipe.run();
});