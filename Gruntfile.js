module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-bower-install');
  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-filerev');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    clean: {
      dist: ['dist']
    },
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
    copy: {
      dist: {
        files: [
          {
            src: 'index.html',
            dest: 'dist/index.html'
          },
          {
            src: 'assets/**',
            dest: 'dist',
            expand: true
          }
        ]
      }
    },
    watch: {
      files: ['js/**/*.js', 'Gruntfile.js'],
      tasks: ['concat:game']
    },
    open: {
      dev: {
        path: 'http://localhost:8080/index.html'
      }
    },
    filerev: {
      options: {
        algorithm: 'md5',
        length: 8
      },
      js: {
        src: 'dist/**/*.js'
      }
    },
    useminPrepare: {
      html: 'index.html',
      options: {
        dest: 'dist'
      }
    },
    usemin: {
      html: 'dist/index.html'
    },
    concat: {
      game: {
        files: [
          {
            src: 'js/**/*.js',
            dest: 'dist/game.js'
          }
        ]
      }
    }
  });

  // simple build task
  grunt.registerTask('build', 
                     [
                       'clean:dist',
                       'copy:dist',
                       'concat:game',
                       'useminPrepare',
                       'concat:generated',
                       'uglify:generated',
                       'filerev',
                       'usemin'
                     ]);

  grunt.registerTask('default', ['connect', 'open', 'concat:game', 'watch']);
}

