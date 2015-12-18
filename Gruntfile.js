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
        evil: true, // !!
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      plugin: {
        src: 'package.json'
      },
      test: {
        src: [ 'test/**/*.js']
      },
      code: {
        src: [ '*.js', 'js/*.js', "!Gruntfile.js"]
      },
      data: {
        src: ['data/*.json', 'plugin/*.json', 'plugin/data/*.json']
      },
      all: {
        src: [ '<%= jshint.code.src %>', '<%= jshint.data.src %>', '<%= jshint.test.src %>']
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
      plugin: {
        files: '<%= jshint.plugin.src %>',
        tasks: ['jshint:plugin', 'plugin']
      },
      template: {
        files: 'data/template.html',
        tasks: ['copy:code']
      },
      code: {
        files: '<%= jshint.code.src %>',
        tasks: ['jshint:code', 'copy:code']
      },
      test: {
        files: '<%= jshint.test.src %>',
        tasks: ['jshint:test']
      }
    },    

    bootstrap_src: "./node_modules/bootstrap/dist",
    plates_src: "https://raw.githubusercontent.com/flatiron/plates/v0.4.11/lib",
    target: "./plugin",
    lib_path: "<%= target %>/js/lib",
    plugin_config: {
        path: "<%= target %>/",
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
      files : ["<%= target %>/*.json" ,"<%= target %>/data/config-*.json"],
        options : {}
    },
    copy: {
      lib: {
        files: [{
            cwd: "<%= bootstrap_src %>/css",
            src: 'bootstrap.min.css',
            dest: "<%= target %>/css/",
            expand: true
        }, 
        {
            cwd: "<%= bootstrap_src %>/js",
            src: 'bootstrap.min.js',
            dest: "<%= lib_path %>/",
            expand: true
        },
        {
            cwd: "<%= lib_path %>",
            src: 'jquery-*.js',
            dest: "<%= lib_path %>/",
            expand: true,
            dot: true,
            rename: function(dest, src) {
              return dest + 'jquery.min.js';
            }
        }]
      },
      code: {
        files: [{
            cwd: './data',
            src: '*.html',
            dest: '<%= target %>/data/',
            expand: true
        },
        {
            cwd: './',
            src: 'background*.js',
            dest: '<%= target %>/',
            expand: true
        },
        {
            cwd: './js',
            src: '*.js',
            dest: '<%= target %>/js/',
            expand: true
        }]
      }
    },
    jquery: {
      dev: {
        output: '<%= lib_path %>',
        options: {
          prefix: "jquery-",
          minify: true
        },
        versions: [ "1.11.1" ]
      }
    },

    jq_version: function() {
      var jq = grunt.config('jquery').dev;
      return jq.options.prefix.concat(jq.versions[0])+'.js';
    },
    http: {
      plates: {
        options: {
          url: '<%= plates_src %>/plates.js',
        },
        dest: '<%= lib_path %>/plates.js'
      }
    }    
  });

/* ## devDependencies in package.json
  "grunt-contrib-concat": "~0.4.0",
  "grunt-contrib-uglify": "~0.5.0",
  "grunt-contrib-qunit": "~0.5.2",

*/
  // grunt.loadNpmTasks('grunt-contrib-concat');
  // grunt.loadNpmTasks('grunt-contrib-uglify');
  // grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks("grunt-jsbeautifier");  
  grunt.loadNpmTasks("grunt-jquery-builder");
  grunt.loadNpmTasks('grunt-http');

  grunt.registerTask('build', ['clean', 'libraries', 'plugin', 'copy:code', 'jshint:all']);
  
  grunt.registerTask('libraries', ['jquery', 'http', 'copy:lib', 'decruft']);

  grunt.registerTask('plugin', ['plugin_config', 'jsbeautifier', 'readme']);
  
  grunt.registerTask('clean', function() {
      // TODO: replace with proper implementation
      // no-op
  });

  grunt.registerTask('decruft', function() {
      var fs = require('fs'),
      file = grunt.config('lib_path').concat('/', grunt.config('jq_version')());
      fs.unlinkSync(file);
  });

  grunt.registerTask('readme', function() {
      var file = 'README.md',
      path = grunt.config('lib_path');
      grunt.file.write(path.concat(file), grunt.config('readme'));
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
      var packageJs = function(moz, name) {
        var result = {};
        moz.exclude.push(name);
        Object.keys(pkg).forEach(function(key) {
          var item = pkg[key];
          if (moz.exclude.indexOf(key) === -1) {
            result[key] = item;
          }
        });
        return result;
      };

      var moz = merge(options.mozilla, cfg.mozilla);
      save(moz.package.file, packageJs(moz, this.name));
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
          run_at: 'document_end',
      }];
      save(webkit.package.file, manifestJs);
      save(webkit.config.file, prefixOptions('./img/', './data/'));
  });
};
