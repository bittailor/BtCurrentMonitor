var path = require('path');
var spawn = require('child_process').spawn;
var fs = require('fs-extra')

var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();


var conf = {
    ui: {
        src: './web-ui',
        out: './build/web-ui'
    },
    fw: {
        out: './build/firmware'
    }
};

gulp.task('fw-compile', function(cb){
    fs.mkdirs(conf.fw.out,function(err){
        spawn('particle', ['compile', 'photon', './firmware',  '--saveTo' ,  path.join(conf.fw.out , 'BtCurrentMonitor.bin')],{
            stdio: 'inherit'
        }).on('exit', (code) => {
            cb(code)
        }); 
    })
});

gulp.task('fw-flash', function(cb){
    spawn('particle', ['flash', 'bt-photon-1', './firmware'],{
        stdio: 'inherit'
    }).on('exit', (code) => {
        cb(code)
    }); 
});

gulp.task('copy', function () {
    var fileFilter = plugins.filter(function (file) {
        return file.stat.isFile();
    });

    return gulp.src([
            path.join(conf.ui.src, '/**/*')
        ])
        .pipe(fileFilter)
        .pipe(gulp.dest(path.join(conf.ui.out, '/')));
});


gulp.task('inject-js', ['copy'], function () {
    return gulp.src(path.join(conf.ui.out, 'index.html'))
        .pipe(plugins.inject(gulp.src(path.join(conf.ui.out, '**/*.js'))
            .pipe(plugins.angularFilesort())
            ,{relative: true}
        ))
        .pipe(gulp.dest(conf.ui.out));
});

gulp.task('ui-build', ['inject-js']);

gulp.task('ui-build-watch', ['ui-build'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('serve', ['ui-build'], function () {
    browserSync.init({
        server: {
            baseDir: conf.ui.out
        }
    });

    gulp.watch(path.join(conf.ui.src, '**/*.*'), ['ui-build-watch']);
});


gulp.task('build',['fw-compile','ui-build'])

gulp.task('default', ['build']);