var express = require('express')
var app = express()
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var bodyParser = require('body-parser');
var sanitizeHtml = require('sanitize-html');
var compression = require('compression')
var template = require('./lib/template.js');

var multer = require('multer');
var  _storage = multer.diskStorage({
	destination : function (req, file, cb) {
		cb(null, 'uploads')},
	filename : function (req, file, cb) {
		cb(null, file.originalname);}
});

var upload = multer({ storage : _storage})
//dest(=destination) 사용자가 업로드한 파일을 uploads에 저장
//storage storage객체 생성가능

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());
app.get('*', function(request, response, next){
  fs.readdir('./data', function(error, filelist){
    request.list = filelist;
    next();
  });
});

app.get('/', function(request, response) {
  var title = '졸작화이팅!';
  var description = 'server by EasterEgg';
  var list = template.list(request.list);
  var html = template.HTML(title, list,
    `
    <center><h2>${title}</h2>${description}
    <img src="/images/easter.jpg" style="width:1000px; display:block; margin-top:10px;"></center>
    `,
    `<center><h1><a href="/uploads">upload</a></h1></center>`
  ); 
  response.send(html);
});

app.use('/user', express.static('uploads'));
app.set('views', './views_file');
app.set('view engine', 'jade');

app.get('/uploads', function(req, res){
  fs.readdir('./uploads', function(error, filelist){
	  var title = 'WEB- upload';
	  var description = '';
	  var list = '<ul>';
	  var i = 0;
	  while(i < filelist.length){
		  list = list + `<li><a href="uploads/${filelist[i]}">${filelist[i]}</a></li>`;
		  i = i + 1;
	  }
	  list = list+'</ul>';
	  var template = `
	  <!doctype html>
	  <html>
	  <head>
	    <title>${title}</title>
	    <meta charset="utf-8">
	  </head>
	  <body>
	    <h1>${list}</h1>
	    <a href="/">back</a>
	  </body>
	  </html>`;;
	  res.end(template);
	  res.render('upload');
	 
  });
});
app.get('/uploads/bed', function(req, res){
	res.render('upload');
});
app.post('/uploads', upload.single('userfile'), function(req, res){
	res.send('Uploaded : '+req.file.filename+' !');
});


app.get('/page/:pageId', function(request, response) { 
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
    var title = request.params.pageId;
    var sanitizedTitle = sanitizeHtml(title);
    var sanitizedDescription = sanitizeHtml(description, {
      allowedTags:['h1']
    });
    var list = template.list(request.list);
    var html = template.HTML(sanitizedTitle, list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/create">create</a>
        <a href="/update/${sanitizedTitle}">update</a>
        <form action="/delete_process" method="post">
          <input type="hidden" name="id" value="${sanitizedTitle}">
          <input type="submit" value="delete">
        </form>`
    );
    response.send(html);
  });
});
 
app.get('/create', function(request, response){
  var title = 'WEB - create';
  var list = template.list(request.list);
  var html = template.HTML(title, list, `
    <form action="/create_process" method="post">
      <p><input type="text" name="title" placeholder="title"></p>
      <p>
        <input type="submit" value="누르면 서버에 파일 쌓인다ㅜㅜ">
      </p>
    </form>
  `, '');
  response.send(html);
});
 
app.post('/create_process', function(request, response){
  var post = request.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, 'utf8', function(err){
    response.writeHead(302, {Location: `/?id=${title}`});
    response.end();
  });
});
 
app.get('/update/:pageId', function(request, response){
  var filteredId = path.parse(request.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function(err, description){
    var title = request.params.pageId;
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `
      <form action="/update_process" method="post">
        <input type="hidden" name="id" value="${title}">
        <p><input type="text" name="title" placeholder="title" value="${title}"></p>
        <p>
          <textarea name="description" placeholder="description">${description}</textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
      `,
      `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
    );
    response.send(html);
  });
});
 
app.post('/update_process', function(request, response){
  var post = request.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function(error){
    fs.writeFile(`data/${title}`, description, 'utf8', function(err){
      response.redirect(`/?id=${title}`);
    })
  });
});
 
app.post('/delete_process', function(request, response){
  var post = request.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function(error){
    response.redirect('/');
  });
});
//file upload

app.listen(80, function() {
  console.log('Connected port 80!')
});
