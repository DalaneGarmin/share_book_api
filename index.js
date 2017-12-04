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



app.post('/api/book/', (req, res) => {
  let {
    empid,
    isbn
  } = req.body;
  console.log('add api', req.body)
  let sql_string = 'insert into book_own values(?, ?, 0)';
  db.open(process.env.DB)
    .then(() => db.run(sql_string, empid, isbn))
    .catch(err => {
      console.log(err);
    });
  res.end();
});




app.delete('/api/book/', (req, res) => {
  let {
    empid,
    isbn
  } = req.body;
  console.log('del api', req.body)
  let sql_string = 'delete from book_own where owner = ? and isbn = ?';;
  db.open(process.env.DB)
    .then(() => db.run(sql_string, empid, isbn))
    .catch(err => {
      console.log(err);
    });
  res.end();
});


app.get('/api/bookOwner/:query', (req, res) => {
  // isbn => [book_owners]
  let sql_string = 'Select owner, send_to from book_own where isbn=?';
  openDbThenQueryAll(req, res, sql_string)

})


app.get('/api/mybookout/:query', (req, res) => {
  let sql_string = 'Select * from book_record join books  where owner=? and  book_record.isbn = books.isbn';

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


function openDbThenQueryAll(req, res, sql) {
  db.open(process.env.DB)
    .then(() => db.all(sql, req.params.query))
    .then(data => res.json(data))
    .catch(err => {
      console.log(err);
      res.end();
    });
}

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
  let sql_string = "Select distinct books.* from books join book_own where instr(books.title, ?) > 0 and books.isbn = book_own.isbn"
  openDbThenQueryAll(req, res, sql_string);
});

app.get('/api/publisher/:query', (req, res) => {
  let sql_string = 'Select * from books where publisher=?';
  openDbThenQueryAll(req, res, sql_string);
});


// app.get('/api/bookrecord/:owner', (req, res)=>{
//   let sql_string = 'select * from book_record where owner=?'
//   let{owner, send_to, isbn} = req.params;
//   db.open(process.env.DB)
//   .then( ()=>db.all(sql_string, owner, send_to, isbn))
//   .then( (res)=>{ console.log(res)})
//   res.end();
// });

app.get('/api/bookrecord/:owner', (req, res)=>{
  let sql_string = 'select * from book_record where owner=? or send_to = ?'
  let{owner, send_to, isbn} = req.params;
  db.open(process.env.DB)
  .then( ()=>db.all(sql_string, owner, owner))
  .then( (res)=>{ console.log(res)})
  res.end();
});


// api thinking.
// owner, guest, isbn, status, owner see, guest see
// ownerid, guestid, 5566, guest -----> owner(book), requested, requsting
// ownerid, guestid, 5566, guest <-book owner, bookCheckOut, bookCheckIn
// ownerid, guestid, 5566, guest book-> owner, bookCheckIn, bookCheckOut
// ownerid, guestid, 5566, completed, completed, completed

// app.get('/api/bookrecord/:owner/:send_to/:isbn', (req, res)=>{
//   let sql_string = 'select * from book_record where owner=? and send_to = ? and isbn = ?'
//   let{owner, send_to, isbn} = req.params;
//   db.open(process.env.DB)
//   .then( ()=>db.get(sql_string, owner, send_to, isbn))
//   .then( (res)=>{ console.log(res)})
//   res.end();
// });

app.post('/api/crawl/', (req, res) => {
  let {
    productID
  } = req.body;
  console.log('crawl api', productID)
  let sql_string = 'insert into request_crawler values(?, ?, ?)';
  db.open(process.env.DB)
    .then(() => db.run(sql_string, productID, 'pending', Date.now()))
    .catch(err => {
      console.log(err)
    })
  res.end()
})


app.get('/', (req, res) => {
  console.log('hello');
  res.send('hello');
});


app.listen(3128, () => {
  console.log('server on');
});
