module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-wiredep');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 8080,
          base: '.'
        }
      }
    },
    wiredep: {
      default: {
        src: 'index.html'
      }
    },
    watch: {
      files: ['js/*.js', 'Gruntfile.js'],
      tasks: ['concat']
    },
    open: {
      dev: {
        path: 'http://localhost:8080/index.html'
      }
    },
    concat: {
      dist: {
        src: 'js/*.js',
        dest: 'dist/game.js'
      }
    }
  });

  grunt.registerTask('default', ['connect', 'open', 'watch']);
}

