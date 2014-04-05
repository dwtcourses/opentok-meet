var gulp = require('gulp'),
    bower = require('gulp-bower'),
    exec = require('child_process').exec;

gulp.task('default', function(){
  bower()
    .pipe(gulp.dest('public/js/lib/'));
});

gulp.task('cordova-bower', function (cb) {
  // couldn't figure out how to get bower to run in a different directory
  exec('cd opentok-meet-cordova;bower install');
  
  // Compile common-js-helpers
  exec('cd opentok-meet-cordova/www/js/lib/common-js-helpers;npm install;grunt', function (err, stdout) {
    console.log(stdout);
    cb(err);
  });
});

gulp.task('cordova', ['cordova-bower'], function (cb) {
  // Copy over the single-sourced JS
  gulp.src('./public/js/*.js')
    .pipe(gulp.dest('opentok-meet-cordova/www/js'));
  
  // Copy over the single-source CSS
  gulp.src('./public/css/*.css')
    .pipe(gulp.dest('opentok-meet-cordova/www/css'));
  
  // Copy over the images
  gulp.src('./public/images/*.png')
    .pipe(gulp.dest('opentok-meet-cordova/www/images'));

  var prepare = function () {
    // Add the ios platform
    exec('cd opentok-meet-cordova;cordova platform add ios', function (err) {
      // Prepare for ios
      exec('cd opentok-meet-cordova;cordova prepare ios', function (err) {
        if (err) cb(err);
        else {
          // Copy over icons
          gulp.src('./opentok-meet-cordova/src/icons/ios7/*.png')
            .pipe(gulp.dest('opentok-meet-cordova/platforms/ios/OpenTokMeet/Resources/icons'));
          // Copy over splash screens
          gulp.src('./opentok-meet-cordova/src/splash/*.png')
            .pipe(gulp.dest('opentok-meet-cordova/platforms/ios/OpenTokMeet/Resources/splash'));
          exec('open opentok-meet-cordova/platforms/ios/OpenTokMeet.xcodeproj');
          cb();
        }
      });
    });
  };
  
  var cordovaPlugins = {
    'com.tokbox.cordova.opentok': 'https://github.com/phonegap-build/StatusBarPlugin.git',
    'com.phonegap.plugin.statusbar': 'https://github.com/phonegap-build/StatusBarPlugin.git'
  };
  // Install the cordova plugins if they're not already there
  var output = exec('cd opentok-meet-cordova;cordova plugin list', function (err, stdout, stderr) {
    if (err) {
      cb(err);
      return;
    }
    var plugins = Object.keys(cordovaPlugins);
    var getNextPlugin = function() {
      var key = plugins.pop();
      if (!key) {
        prepare();
        return;
      }
      if (stdout.indexOf(key) < 0) {
        console.log('Installing cordova plugin from: ' + cordovaPlugins[key]);
        exec('cd opentok-meet-cordova;cordova plugin add ' + cordovaPlugins[key], function (err, stdout, stderr) {
          console.log(stdout);
          if (err) cb(err);
          else {
            getNextPlugin();
          }
        });
      } else {
        getNextPlugin();
      }
    };
    getNextPlugin();
  });
});

gulp.task('serve-ios', ['cordova'], function (cb) {
  exec('cd opentok-meet-cordova;cordova serve ios');
});