module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bower-install');

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
    bowerInstall: {
      default: {
        src: 'index.html'
      },
      test: { // https://github.com/stephenplusplus/grunt-wiredep/issues/35
        src: 'karma.conf.js',
        fileTypes: {
          js: {
            block: /(([\s\t]*)\/\/\s*bower:*(\S*))(\n|\r|.)*?(\/\/\s*endbower)/gi,
            detect: {
              js: /'.*\.js'/gi
            },
            replace: {
              js: '\'{{filePath}}\','
            }
          }
        }
      }
    },
    watch: {
      files: ['js/**/*.js', 'Gruntfile.js'],
      tasks: ['concat']
    },
    open: {
      dev: {
        path: 'http://localhost:8080/index.html'
      }
    },
    concat: {
      dist: {
        src: 'js/**/*.js',
        dest: 'dist/game.js'
      }
    }
  });

  grunt.registerTask('default', ['connect', 'open', 'watch']);
}

