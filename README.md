# gulp-symfony-config-example
My Gulp config for typical symfony 2/3 project. Includes BrowserSync with CSS Injection.
Based on: https://knpuniversity.com/screencast/gulp

Shows following additional features:
1) Adds ability to execute console commands in order with Pipeline class;
   (If some command fails, command execution stops)
2) Adds browserSync Gulp integration with Css injection support;
3) Modifies AssetExtension class - now css/js assets are versioned only in prod environment,
   because dynamic name change will force browserSync to perform full page reload instead
   of Css injection on sass/css file changes;
4) Extends FosJsRoutingBundle to override initialize method in dump command and inject target
    arg to InputInterface object. (We want apply versioning to 'fos_js_routes.js' file as well on production
    environment)