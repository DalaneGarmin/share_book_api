let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let db = require('sqlite');
let cors = require('./cors')

require("dotenv").config();
console.log('env:', process.env.NODE_ENV);
app.use(cors);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));


function clean_books(books) {
  return books.map(item => {
    console.log(item);
    return {
      title: item.title,
      isbn: item.isbn,
      publisher: item.publisher,
      author: item.author
    }
  })
}

app.delete('/api/book/', (req, res) => {
  let {
    empid,
    isbn
  } = req.body;
  console.log('del api', req.body)
  let sql_string = 'delete from book_own where owner = ? and isbn = ?';

  db.open(process.env.DB)
    .then(() => db.run(sql_string, empid, isbn))
    .catch(err => {
      console.log(err);
    });
  res.end();
});

app.post('/api/book/', (req, res) => {
  let {
    empid,
    isbn
  } = req.body;
  console.log('add api')
  let sql_string = 'insert into book_own values(?, ?, 0)';
  db.open(process.env.DB)
    .then(() => db.run(sql_string, empid, isbn))
    .catch(err => {
      console.log(err);

    });
  res.end();
});


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
