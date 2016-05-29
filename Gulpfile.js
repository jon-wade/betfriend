//require('es6-promise').polyfill();
var gulp = require('gulp');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var gulpCleanCSS = require('gulp-clean-css');


gulp.task('useref', function(){
    return gulp.src('./app/**/*.html')
        .pipe(useref())
        .pipe(gulpIf('*.js', uglify({mangle: false})))
        .pipe(gulpIf('*.css', gulpCleanCSS({rebase: false})))
        .pipe(gulp.dest('build/'));
});


gulp.task('moveImages', function(){
    return gulp.src('./app/img/**/*.+(png|jpg|gif|svg)')
        .pipe(gulp.dest('build/img'));
});

gulp.task('moveStyleSheets', function(){
    return gulp.src('./app/round-*.css').pipe(gulp.dest('build/'));
});

gulp.task('build', ['useref', 'moveImages', 'moveStyleSheets']);
