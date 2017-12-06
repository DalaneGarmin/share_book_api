let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let db = require('sqlite');
let cors = require('./cors');
let passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  session = require('express-session'),
  request = require('request'),
  Redis = require('ioredis')

require("dotenv").config();
app.use(cors);

let client = new Redis();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  console.log('serializeUser', user)
  let id = (Math.random() * Number.MAX_SAFE_INTEGER).toString(32);
  client.set(id, user)
    .then((result) => console.log('set ', user, ' to ', id))
    .catch(err => console.log('err', err))
  done(null, id);
})

passport.deserializeUser((id, done) => {
  console.log('id', id)
  client.get(id)
    .then(user => {
      console.log('deserial', user)
      done(null, user)
    })
    .catch(err => {
      console.log('err', err);
      done(err)
    })
})

passport.use('local', new LocalStrategy({
    usernameField: "username",
    passwordField: "password"
  },
  function(username, password, done) {
    console.log('un, pw', username, password)

    var options = {
      method: 'POST',
      url: 'http://ws.garmin.com.tw/passport/aurzt.asmx/chkPassportUser',
      form: {
        Empid: username,
        sPassword: password
      }
    };
    request(options, function(error, response, body) {
      // console.log('request login server')
      if (error) done(error);
      let logined = body.includes('<string xmlns="http://tempuri.org/">1</string>');
      if (logined) {
        console.log('yeah login', username);
        done(null, username);
      } else {
        console.log('no who are you');
        done(null, false, {
          message: 'fail'
        });
      }
    });
  }
));



console.log('env:', process.env.NODE_ENV);




app.post('/login', passport.authenticate('local', {
    session: true
  }),
  (req, res) => {
    if (req.isAuthenticated()) {
      res.json({
        status: 'OK',
        username: req.user
      });
    } else {
      res.json({
        status: 'fail'
      });
    }
  });


app.get('/logout', (req, res) => {
  console.log('in logout')
  req.logout()
  res.end();
});



function clean_books(books) {
  return books.map(item => {

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


app.get('/api/bookOwner/:query',
  (req, res) => {
    // isbn => [book_owners]
    if (req.isAuthenticated()) {
      console.log('is auth')
    } else {
      console.log('not auth')
    }
    console.log('req.user', req.user);
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



app.get('/api/bookrecord/:owner', (req, res) => {
  let sql_string = 'select book_record.*, books.title from book_record join books where (book_record.owner=? or book_record.send_to = ?) and book_record.isbn = books.isbn'
  let {
    owner,
    send_to,
    isbn
  } = req.params;
  db.open(process.env.DB)
    .then(() => db.all(sql_string, owner, owner))
    .then((result) => {
      console.log(result)
      res.json(result)
    })
    .catch(() => res.end())
});








app.post('/api/bookTrade', (req, res) => {
    let {
      owner,
      isbn,
      send_to
    } = req.body;
    let init_state = 'guest -> owner(book)';
    let sql_string = 'insert into book_record values(?, ?, ?, ?)';
    db.open(process.env.DB)
      .then(() => db.run(sql_string, owner, isbn, send_to, init_state))
      .catch((err) => console.log('insert book_record err', err));

    res.end();

  })
  .delete('/api/bookTrade', (req, res) => {
    let {
      owner,
      isbn,
      send_to
    } = req.body;
    let init_state = 'guest -> owner(book)';
    let sql_string = 'delete from  book_record where owner=? and isbn=? and send_to = ? and status = ?';
    db.open(process.env.DB)
      .then(() => db.run(sql_string, owner, isbn, send_to, init_state))
      .catch((err) => console.log('delete book_record err', err));

    res.end();


  })
  .put('/api/bookTrade', (req, res) => {

  })


// api : bookRecord : delete a record (owner, guest, 5566, 'guest -> owner(book)')
// app.delete

// ownerid, guestid, 5566, guest <-book owner, bookIsComing, bookIsSending |
// Event : Owner Click Ok, i'll send you. / Event : No, I need this book
// api : bookRecord : update a record from (owner, guest, 5566, 'guest -> owner(book)') to (owner, guest, 5566, 'guest <-book')
//                    update a record (owner, guest, 5566, 'decline')
// app.update

// ownerid, guestid, 5566, guest(book) - owner, bookIn, bookOut |
// Event : guest : i received book
// api : bookRecord : update a record from  (owner, guest, 5566, 'guest <-book') to (owner, guest, 5566, 'guest(book) - owner')
// app.update

// ownerid, guestid, 5566, guest book-> owner, bookGoingBack, bookComingingBack |
// Event : owner want book/ guest want to return book.
// api : bookRecord : update a record from  (owner, guest, 5566, 'guest(book) - owner') to (owner, guest, 5566, guest book-> owner)
// app.update

// ownerid, guestid, 5566, completed, completed, completed |
// Event : owner: ok i get my book back.
// api : bookRecord : update a record from  (owner, guest, 5566, 'guest(book) - owner') to (owner, guest, 5566, complete)
// app.update

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
