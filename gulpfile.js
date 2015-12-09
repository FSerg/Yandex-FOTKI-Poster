// gulp
var gulp = require('gulp');
var gls = require('gulp-live-server');
var nodemon = require('gulp-nodemon');

// plugins
var concat = require('gulp-concat');
var connect = require('gulp-connect');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');
var clean = require('gulp-clean');
var del = require('del');
var inject = require('gulp-inject');
var size = require('gulp-size');
var runSequence = require('run-sequence').use(gulp);
var browserSync = require('browser-sync');

////////////////////
// DEVELOPMENT TASKS

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
});

gulp.task('start-dev', function () {

    var server = gls.new('backend/server.js');
    server.start();

    //use gulp.watch to trigger server actions(notify, start or stop)
    // gulp.watch(['frontend/**/*.css', 'frontend/**/*.html'], function (file) {
    //     //console.log('ch: '+file);
    //     server.notify.apply(server, [file]);
    // });

    // gulp.watch('./frontend/**/*.js').on('change', browserSync.reload);
    gulp.watch('frontend/index.html', function() {
        runSequence(
          ['inject-index'],
          browserSync.reload
        );
    });

    gulp.watch('./backend/**/*.js', function() {
        server.start.bind(server)();
    });

});

gulp.task('browser-sync', ['start-dev'], function() {
    browserSync.init(null, {
        proxy: "localhost:3000",
        files: ['frontend/**/*.*', '!frontend/index.html'],
        port: 5000,
    });
});

gulp.task('default', function() {
    runSequence(
      ['lint', 'inject-index'],
      ['browser-sync']
    );
});

///////////////////
// PRODUCTION TASKS

gulp.task('clean', function() {
    return del(['dist/**/*']);
});

gulp.task('copy-init-files', function () {
  gulp.src(['./package.json','./bower.json','./.bowerrc','./gulpfile.js'])
    .pipe(gulp.dest('dist/'));
});

gulp.task('copy-backend', function () {
  gulp.src('./backend/**')
    .pipe(gulp.dest('dist/backend'));
});

gulp.task('copy-html-files', function () {
  gulp.src(['./frontend/**/*.html', '!./frontend/bower_components/**'])
    .pipe(gulp.dest('dist/frontend/'));
});


gulp.task('my-css', function() {
  var opts = {comments:true,spare:true};
  return gulp.src(['./frontend/**/*.css', '!./frontend/bower_components/**'])
    .pipe(size())
    .pipe(concat('style.min.css'))
    .pipe(minifyCSS(opts))
    .pipe(size())
    .pipe(gulp.dest('./dist/frontend/style/'));
});

gulp.task('my-js', function() {
  return gulp.src(['./frontend/**/*.js', '!./frontend/bower_components/**'])
    .pipe(size())
    .pipe(concat('app.min.js'))
    .pipe(uglify({
      // inSourceMap:
      // outSourceMap: "app.js.map"
    }))
    .pipe(size())
    .pipe(gulp.dest('./dist/frontend/'));
});


gulp.task('inject-index-build', function () {
  var target = gulp.src('./dist/frontend/index.html');
  var sources = gulp.src(['./dist/frontend/style/style.min.css', './dist/frontend/app.min.js']);

  return target.pipe(inject(sources, {relative: true}))
    .pipe(gulp.dest('./dist/frontend'));
});

gulp.task('build', function() {
    runSequence(
      'clean',
      ['lint', 'my-css', 'my-js', 'copy-html-files', 'copy-init-files', 'copy-backend'],
      'inject-index-build'
    );
});

gulp.task('start-prod', function () {
    nodemon({
      script: './dist/backend/server.js',
      env: {NODE_ENV: 'production'},
      watch: ['!*.*'],
      quiet: true
    });
});
