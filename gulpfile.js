var gulp = require('gulp'),
  pug = require('gulp-pug'),
  sass = require('gulp-sass'),
  imagemin = require('gulp-imagemin'),
  pngquant = require('imagemin-pngquant'),
  webserver = require('gulp-webserver'),
  plumber = require('gulp-plumber'),
  watch = require('gulp-watch'),
  cleaner = require('rimraf'),
  sequence = require('gulp-sequence'),
  bower = require('main-bower-files'),
  fs = require('fs'),
  rename = require('gulp-rename'),
  path = {
    src: {
      html: 'resources/views/pages/**/*.pug',
      css: 'resources/styles/style.scss',
      js: 'resources/scripts/*.js',
      img: 'resources/images/**/*.*',
      tags: 'resources/data/tags.json',
      descriptions: 'resources/data/descriptions/'
    },
    watch: {
      html: 'resources/views/**/*.pug',
      css: 'resources/styles/**/*.scss',
      js: 'resources/scripts/*.js',
      img: 'resources/images/**/*.*',
	    descriptions: 'resources/data/descriptions/*.html'
    },
    build: {
      html: 'build/',
      css: 'build/css/',
      js: 'build/js/',
      img: 'build/img/'
    }
  };

var cache = [];
var tags;

// Запуск локального сервера
gulp.task('localserver', function() {
  gulp.src(path.build.html)
    .pipe(webserver({
      livereload: true,
      open: true,
      fallback: 'index.html'
    }));
});

// Чистка папки продакшена
gulp.task('clean', function (cb) {
  cleaner(path.build.html, cb);
});

gulp.task('indexJSON', function () {
	tags = JSON.parse(fs.readFileSync(path.src.tags));
});

gulp.task('indexDESCS', function () {
	tags.forEach(function (tag, index) {
		var filePath = path.src.descriptions + tag.name +'.html';
		var isExistFilePath = fs.existsSync(filePath);
		
		if(!tag.description) {
			if(!isExistFilePath) fs.appendFileSync(filePath, '<p>Описания пока нет...</p>', 'utf8');
			
			cache[index] = fs.readFileSync(filePath, 'utf8');
		}
	});
});

// Запуск компиляции HTML
gulp.task('html', function() {

  return gulp.src(path.src.html)
    .pipe(plumber())
    .pipe(pug({
      pretty: true,
      data: {
        tags: tags,
        time: new Date()
      }
    }))
    .pipe(gulp.dest(path.build.html));
});

gulp.task('tags_page', function () {

  tags.forEach(function(tag, index) {
	  if(!tag.description) tag.description = cache[index];
	  
	  gulp.src('resources/views/pages/tag.pug')
		  .pipe(pug({
			  pretty: true,
			  data: tag
		  }))
		  .pipe(rename({
			  basename: tag.name
		  }))
		  .pipe(gulp.dest(path.build.html));
  });
});

// Запуск компиляции CSS
gulp.task('css', function() {
  gulp.src(path.src.css)
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .pipe(gulp.dest(path.build.css));
});

// Сжатие javascript
gulp.task('js', function() {
  return gulp.src(path.src.js)
    .pipe(plumber())
    // .pipe(uglyjs())
    // .pipe(rename(function (path) {
    //   path.basename += ".min"
    // }))
    .pipe(gulp.dest(path.build.js));
});

// Сжатие изображений
gulp.task('image', function() {
  return gulp.src(path.src.img)
    .pipe(plumber())
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(path.build.img));
});

gulp.task('vendors', function() {
  var styles = gulp.src(bower({group: 'css'}))
    .pipe(plumber())
    .pipe(gulp.dest(path.build.css +'/vendors'));

  var scripts = gulp.src(bower({group: 'js'}))
    .pipe(plumber())
    .pipe(gulp.dest(path.build.js +'/vendors'));

  return [styles, scripts];
});

// Копирование файлов
gulp.task('copy', function () {
  gulp.src('./resources/fonts/**/*.{ttf,woff,woff2,eof,eot,svg}')
    .pipe(gulp.dest('./build/fonts'))
});

// Наблюдение за изменением файлов
gulp.task('default', ['localserver', 'indexJSON', 'indexDESCS'], function() {

	watch(path.watch.html, function () {
		gulp.start('html', 'tags_page');
	});
	
	watch(path.src.tags, function () {
		gulp.start('indexJSON', 'indexDESCS', 'html', 'tags_page');
	});
	
	watch(path.watch.descriptions, function () {
		gulp.start('indexDESCS', 'tags_page');
	});
	
  watch(path.watch.css, function(event, cb) {
    gulp.start('css');
  });
  watch(path.watch.js, function(event, cb) {
    gulp.start('js');
  });
  watch([path.watch.img], function(event, cb) {
    gulp.start('image');
  });
});

// Выполнение всех тасков по порядку
gulp.task('build', sequence('clean', 'html', ['tags_page', 'css'], 'js', 'image', 'vendors', 'copy'));