/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    readme: '#<%= pkg.title || pkg.name %>\n' +
      '## <%= pkg.description %>\n' +
      '<%= pkg.readme %>\n',
    // Task configuration.
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      },
      dist: {
        src: ['src/lib/<%= pkg.name %>.js'],
        dest: 'dest/dist/<%= pkg.name %>.js'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false, // !!
        noarg: true,
        sub: true,
        undef: false, // !!
        unused: false, // !!
        boss: true,
        eqnull: true,
        browser: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['*.js', 'js/*.js', '*.json', 'data/*.json', 'test/**/*.js']
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'qunit']
      }
    },    
    plugin_config: {
        path: "./",
        exclusions: ['pkg', 'script'],
        libFiles:  ["jquery.min.js"],
        imageKeys: [],
        dataKeys:  ['template'],
        mozilla: { 
            config: { file: "data/config-mozilla.json" },
            package: { file: "package.json" }
        },
        webkit: { 
            config: { file: "data/config-webkit.json" }, 
            package: { file: "manifest.json" } 
        }
    },
    jsbeautifier : {
      files : ["data/config-*.json", "manifest.json"],
        options : {}
    },
    copy: {
      dev: {
        files: [{
            cwd: 'node_modules/bootstrap/dist/css',
            src: 'bootstrap.min.css',
            dest: 'css/',
            expand: true
        }, 
        {
            cwd: 'node_modules/bootstrap/dist/js',
            src: 'bootstrap.min.js',
            dest: 'js/lib/',
            expand: true
        },
        {
            cwd: 'js/lib',
            src: 'jquery-*.js',
            dest: 'js/lib/',
            expand: true,
            dot: true,
            rename: function(dest, src) {
              return dest + 'jquery.min.js';
            }
        }]
      }
    },
    jquery: {
      dev: {
        output: "js/lib",
        options: {
          prefix: "jquery-",
          minify: true
        },
        versions: [ "1.11.1" ]
      }
    },
    http: {
      plates: {
        options: {
          url: 'https://raw.githubusercontent.com/flatiron/plates/v0.4.11/lib/plates.js',
        },
        dest: 'js/lib/plates.js'
      }
    }    
  });

/* ## devDependencies in package.json
  "grunt-contrib-concat": "~0.4.0",
  "grunt-contrib-uglify": "~0.5.0",
  "grunt-contrib-watch": "~0.6.1",
  "grunt-contrib-qunit": "~0.5.2",

*/
  // grunt.loadNpmTasks('grunt-contrib-concat');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  // grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-jsbeautifier");  
  grunt.loadNpmTasks("grunt-jquery-builder");
  grunt.loadNpmTasks('grunt-http');

  grunt.registerTask('default', ['libraries', 'plugin', 'jshint']);
  
  grunt.registerTask('libraries', ['jquery', 'copy', 'http', 'decruft']);

  grunt.registerTask('plugin', ['plugin_config', 'jsbeautifier', 'readme']);

  grunt.registerTask('decruft', function() {
      var fs = require('fs'),
      file = "js/lib/jquery-1.11.1.js" ; 
      fs.unlinkSync(file);
  });

  grunt.registerTask('readme', function() {
      var file = 'README.md';
      grunt.file.write('./'.concat(file), grunt.config('readme'));
  });

  grunt.registerTask('plugin_config', 'Plugin configuration for Chrome and Webkit ', function() {
      var 
          cfg = grunt.config(this.name),
          pkg = grunt.config('pkg'),
          options = pkg[this.name],
          shared = options.shared;

      var prefix = function(list, prefix) {
          result = [];
          for (var i = 0; i < list.length; i++) {
              var infix = (cfg.libFiles.indexOf(list[i]) !== -1) ? 'lib/' : '';
              result.push(prefix.concat(infix, list[i]));
          }
          return result;
      };
      var prefixOptions = function(img, dat) {
          var result = {};
          Object.keys(options.shared.options).forEach(function(key) {
              if (cfg.imageKeys.indexOf(key) !== -1) {
                  result[key] = img + options.shared.options[key];
              } else if (cfg.dataKeys.indexOf(key) !== -1) {
                  result[key] = dat + options.shared.options[key];
              } else { 
                  result[key] = options.shared.options[key];
              }
          });
          return result;
      };
      var extract = function (browserOpt, exclude) {
          exclude = exclude || cfg.exclusions;
          var result = {};
          for (var i = 0; i < browserOpt.pkg.length; i++) {
              var n = browserOpt.pkg[i];
              result[n] = pkg[n];
          }

          Object.keys(browserOpt).forEach(function(key) {
              if (exclude.indexOf(key) < 0) {
                  result[key] = browserOpt[key];
              }
          });
          return result;
      };
      var merge = function(target, source) {
          Object.keys(source).forEach(function(key) { target[key] = source[key]; });
          return target;
      };
      var save = function(file, content) {
          grunt.file.write(cfg.path.concat(file), JSON.stringify(content) );
      };

      var moz = merge(options.mozilla, cfg.mozilla);
      // var packageJs = extract(options.mozilla);
      // packageJs.title = packageJs.name;
      // save(moz.package.file, packageJs);
      save(moz.config.file, {
          include: shared.target[0],
          contentStyleFile: prefix(shared.style, './../css/'),
          contentScriptFile: prefix(shared.script.concat(moz.script), './../js/'),
          contentScriptOptions: prefixOptions('../img/', './')
      });

      var manifestJs = extract(options.webkit);
      var webkit = merge(options.webkit, cfg.webkit);

      manifestJs.content_scripts = [{
          matches: shared.target,
          css: prefix(shared.style, './css/'),
          js: prefix(shared.script.concat(webkit.script), './js/'),
      }];
      save(webkit.package.file, manifestJs);
      save(webkit.config.file, prefixOptions('./img/', './data/'));
  });
};
