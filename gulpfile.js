// gulp
var gulp = require('gulp');
var gls = require('gulp-live-server');

// plugins
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
//var runSequence = require('run-sequence');
var inject = require('gulp-inject');
var size = require('gulp-size');
var runSequence = require('run-sequence').use(gulp);

var browserSync = require('browser-sync');

// tasks
gulp.task('lint', function() {
  gulp.src(['./frontend/**/*.js', '!./frontend/bower_components/**'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('inject-index', function () {
  var target = gulp.src('./frontend/index.html');
  // It's not necessary to read the files (will speed up things), we're only after their paths:
  var sources = gulp.src(['./frontend/**/*.css', './frontend/**/*.js', '!./frontend/bower_components/**'], {read: false});

  return target.pipe(inject(sources, {relative: true}))
    .pipe(gulp.dest('./frontend'));
    //.pipe(gulp.dest('.'));
});

gulp.task('inject-index-build', function () {
  var target = gulp.src('./dist/frontend/index.html');
  var sources = gulp.src(['./dist/frontend/style/style.min.css', './dist/frontend/app.min.js']);

  return target.pipe(inject(sources, {relative: true}))
    .pipe(gulp.dest('./dist/frontend'));
});


gulp.task('clean', function() {
    gulp.src('./dist/*');
      //.pipe(clean({force: true}));
});

gulp.task('my-css', function() {
  var opts = {comments:true,spare:true};
  gulp.src(['./frontend/**/*.css', '!./frontend/bower_components/**'])
    .pipe(size())
    .pipe(concat('style.min.css'))
    .pipe(minifyCSS(opts))
    .pipe(size())
    .pipe(gulp.dest('./dist/frontend/style/'));
});

gulp.task('my-js', function() {
  gulp.src(['./frontend/**/*.js', '!./frontend/bower_components/**'])
    .pipe(size())
    .pipe(concat('app.min.js'))
    .pipe(uglify({
      // inSourceMap:
      // outSourceMap: "app.js.map"
    }))
    .pipe(size())
    .pipe(gulp.dest('./dist/frontend/'));
});


gulp.task('copy-bower-components', function () {
  gulp.src('./frontend/bower_components/**')
    .pipe(gulp.dest('dist/frontend/bower_components'));
});

gulp.task('copy-html-files', function () {
  gulp.src('./frontend/**/*.html')
    .pipe(gulp.dest('dist/frontend/'));
});

gulp.task('browser-sync', ['connect'], function() {
    browserSync.init(null, {
        proxy: "http://192.168.47.130:3000",
        files: ["frontend/**/*.*"],
        port: 5000,
    });
});

gulp.task('connect', function () {
    //1. run your script as a server
    var server = gls.new('backend/server.js');
    server.start();

    //use gulp.watch to trigger server actions(notify, start or stop)
    // gulp.watch(['frontend/**/*.css', 'frontend/**/*.html'], function (file) {
    //     //console.log('ch: '+file);
    //     server.notify.apply(server, [file]);
    // });

    gulp.watch("frontend/**/*.html").on('change', browserSync.reload);


    gulp.watch('frontend/index.html', ['inject-index']);

    gulp.watch('backend/**/*.js', function() {
       server.start.bind(server)();
    });

});

gulp.task('connectDist', function () {
  connect.server({
    root: 'dist/frontend/',
    port: 9001
  });
});


// default task
gulp.task('default',
  ['lint', 'inject-index', 'browser-sync']
);

gulp.task('build', function() {
  runSequence(
    ['clean'],
    ['lint', 'my-css', 'my-js', 'copy-html-files', 'copy-bower-components'],
    ['inject-index-build'],
    ['connectDist']
  );
});
