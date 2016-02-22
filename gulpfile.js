var $ = require('gulp-load-plugins')();
var gulp = require('gulp');
var sequence = require('run-sequence');
var panini = require('panini');
var supercollider = require('supercollider');
var rimraf = require('rimraf');
var browser = require('browser-sync');
var foundationDocs = require('foundation-docs');
var octophant = require('octophant');

// Configuration for the documentation generator
supercollider
  .config({
    template: foundationDocs.componentTemplate,
    marked: foundationDocs.marked,
    handlebars: foundationDocs.handlebars
  })
  .adapter('sass')
  .adapter('js');

// Cleans the build folder
gulp.task('clean', function(cb) {
  rimraf('_build', cb);
});

// Copies static documentation assets
gulp.task('copy', function() {
  return gulp.src(['docs/assets/**/*', '!docs/assets/scss/**/*'])
    .pipe(gulp.dest('_build/assets'));
});

// Builds documentation pages
gulp.task('html', function() {
  return gulp.src('docs/pages/**/*')
    .pipe($.cached('docs'))
    .pipe(supercollider.init())
    .pipe(panini({
      root: 'docs/pages/',
      layouts: 'docs/layouts/',
      partials: 'docs/partials/'
    }))
    .pipe(gulp.dest('_build'));
});

gulp.task('sass', ['sass:docs', 'sass:foundation']);

// Compiles documentation-specific CSS
gulp.task('sass:docs', function() {
  return gulp.src('docs/assets/scss/docs.scss')
    .pipe($.sass({ includePaths: [process.cwd()] }).on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 9']
    }))
    .pipe(gulp.dest('_build/assets/css'));
});

// Compiles Foundation-specific CSS
gulp.task('sass:foundation', function() {
  return gulp.src('scss/foundation.scss')
    .pipe($.sass().on('error', $.sass.logError))
    .pipe(gulp.dest('_build/assets/css'));
});

// Generates a Sass settings file from the current codebase
gulp.task('settings', function() {
  octophant('scss/**/*.scss', {
    title: 'Foundation for Emails Settings',
    output: 'testing/src/assets/scss/_settings.scss',
    sort: ['global', 'grid']
  });
});

// Lints the Sass codebase
gulp.task('lint', function() {
  return gulp.src('scss/**/*.scss')
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError());
});

// Creates a BrowserSync server
gulp.task('server', ['build'], function() {
  browser.init({
    server: './_build'
  });
});

// Runs the entire build process
gulp.task('build', function(cb) {
  sequence('clean', ['copy', 'html', 'sass'], cb);
});

// Runs the build process, spins up a server, and watches for file changes
gulp.task('default', ['server'], function() {
  gulp.watch('docs/**/*', ['html', browser.reload]);
  gulp.watch('docs/assets/scss/**/*', ['sass:docs', browser.reload]);
  gulp.watch('scss/**/*.scss', ['sass:foundation', browser.reload]);
});
