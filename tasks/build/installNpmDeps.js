module.exports = function (grunt) {
  var { exec } = require('child_process');
  var { resolve } = require('path');

  grunt.registerTask('_build:installNpmDeps', function () {
    grunt.file.mkdir('build/kibana/node_modules');

    exec('npm install  --production --no-optional --python=$(which python2)', {
      cwd: grunt.config.process('<%= root %>/build/kibana')
    }, this.async());
  });
};


