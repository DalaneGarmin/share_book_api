let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let db = require('sqlite');
require("dotenv").config();
console.log('env:', process.env.NODE_ENV);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


function clean_books(books) {
  return books.map(item => {
    return {
      title: item.title,
      isbn: item.isbn,
      publisher: item.publisher
    }
  })
}


app.get('/api/mybookout/:query', (req, res) => {
  let sql_string = 'Select * from book_record join books where owner=? and book_record.isbn = books.isbn';
  db.open(process.env.DB)
    .then(() => db.all(sql_string, 15588))
    .then((books) => res.json(clean_books(books)))
    .catch(err => {
      console.log(err);
      res.end();
    });
});


app.get('/api/mybookin/:query', (req, res) => {
  let sql_string = 'Select * from book_record join books where send_to=? and book_record.isbn = books.isbn';
  db.open(process.env.DB)
    .then(() => db.all(sql_string, 15588))
    .then((books) => res.json(clean_books(books)))

    .catch(err => {
      console.log(err);
      res.end();
    });
});


app.get('/api/mybook/:query', (req, res) => {
  let sql_string = 'Select * from book_own join books where owner=? and book_own.isbn = books.isbn';
  db.open(process.env.DB)
    .then(() => db.all(sql_string, 15588))
    .then((books) => res.json(clean_books(books)))
    .catch(err => {
      console.log(err);
      res.end();
    });
});


function openDbThenQuery(req, res, sql) {
  db.open(process.env.DB)
    .then(() => db.get(sql, req.params.query))
    .then(data => res.json(data))
    .catch(err => {
      console.log(err);
      res.end();
    });
}

app.get('/api/isbn/:query', (req, res) => {
  let sql_string = 'Select * from books where isbn=?';
  openDbThenQuery(req, res, sql_string);
});

app.get('/api/bookname/:query', (req, res) => {
  let sql_string = 'Select * from books where title=?';
  openDbThenQuery(req, res, sql_string);
});

app.get('/api/publisher/:query', (req, res) => {
  let sql_string = 'Select * from books where publisher=?';
  openDbThenQuery(req, res, sql_string);
});




app.get('/', (req, res) => {
  console.log('hello');
  res.send('hello');
});


app.listen(3128, () => {
  console.log('server on');
});
