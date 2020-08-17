var gulp = require('gulp');
var browserSync = require('browser-sync').create();
var sass = require('gulp-sass');
var del = require('del');
var notify = require('gulp-notify');

function runSass() {
  return gulp.src('app/scss/styles.scss')
    .pipe(sass())
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
    .pipe(notify('Sass Compiled!', {
      wait: false
    }));
}

gulp.task('sass', runSass);


gulp.task('browserSync', function () {
  browserSync.init({
    server: {
      baseDir: 'app'
    },
    port: 8000
  });
});

gulp.task('clean:dist', function() {
  return del.sync('dist');
});

gulp.task('watch', function(){
    console.log('watch ran!');
    gulp.parallel(gulp.task('browserSync'), gulp.task('sass'))();
    gulp.watch('app/scss/**/*.scss', runSass)
    gulp.watch('app/*.html', browserSync.reload);
    gulp.watch('app/js/**/*.js', browserSync.reload);
    console.log('watch finished!');
});
