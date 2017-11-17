// Include gulp
var gulp = require('gulp');

// Include plugins
//var jshint = require('gulp-jshint'); //TBD hint it so it stinks less
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var ngAnnotate = require('gulp-ng-annotate');
var del = require("del");
//var bower = require("gulp-bower");

gulp.task('default', function () {
	return gulp.src('angular-coap.js')
        .pipe(sourcemaps.init())
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(rename({
            suffix: '.min'
        }))
        .pipe(sourcemaps.write("./"))
		.pipe(gulp.dest('.'));
});

gulp.task('clean', function(cb) {
  del("angular-coap.min.js",cb);  
});