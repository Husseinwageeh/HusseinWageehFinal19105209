const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs'); 
const mysql = require('mysql2');
const session = require('express-session');

const app = express();
app.use(express.static(__dirname + ""));
app.use(bodyParser.urlencoded({ extended: true }));

// Add session middleware
app.use(session({
  secret: 'no-secrets',
  resave: false,
  saveUninitialized: true
}));

app.set('view engine', 'ejs');

const connection = mysql.createConnection({
  host: '127.0.0.1', // MySQL host
  user: 'root', // MySQL username
  password: 'toor', // MySQL password
  database: 'finaldb' // MySQL database name
});

// Connect to the database
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

  app.get('/', (req, res) => {
    res.redirect('index');
  })
  app.get('/Dashboard', (req, res) => {
    res.redirect('Dashboard');
  })
  app.get('/index', (req, res) => {
    res.redirect('index');
  })

  app.get('/', (req, res) => {
    res.render('index');
  })
  app.get('/history', (req, res) => {
    const selectQuery = 'SELECT * FROM log';
    connection.query(selectQuery, (err, results) => {
      if (err) {
        console.error('Error fetching log data:', err);
        res.status(500).json({ error: 'Error fetching log data' });
        return;
      }

      res.render('history', { results });
    });
  });
  
  app.get('/Dashboard', (req, res) => {
    if (!req.session.username) {
      res.redirect('/login'); // Redirect to login page if session does not exist
      return;
    }

    const selectQuery = 'SELECT * FROM employees WHERE username = ?';
    connection.query(selectQuery, [req.session.username], (err, results) => {
      if (err) {
        console.error('Error fetching user data:', err);
        res.status(500).json({ error: 'Error fetching user data' });
        return;
      }

      const users = results; 
      if (!users) {
        res.redirect('/index'); // Redirect to login page if user does not exist
        return;
      }

      const selectDepartmentQuery = 'SELECT * FROM departments';
      connection.query(selectDepartmentQuery, (err, departmentResults) => {
        if (err) {
          console.error('Error fetching department data:', err);
          res.status(500).json({ error: 'Error fetching department data' });
          return;
        }

        const departments = departmentResults;
        res.render('Dashboard', { users, departments });
      });
    });
  });
  app.get('/index', (req, res) => {
    res.render('index');
  })
  
  
app.post('/api/adddepartment', (req, res) => {
  const { id, name } = req.body;

  // Insert new department
  const insertQuery = 'INSERT INTO departments (Id, Name) VALUES (?, ?)';
  connection.query(insertQuery, [id, name], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ error: 'Error inserting data' });
      return;
    }
    const department = { id, name };
    res.status(200).json({ success: true, message: 'Department added successfully', department });
  });
});

app.post('/api/deleteuser', (req, res) => {
    connection.query('DELETE FROM employees WHERE Id = ?', [req.params.Id], (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Error fetching users' });
        return;
      }
    });
  });
app.post('/api/adduser', (req, res) => {
  const { id, username, password, departmentID } = req.body;

  // Insert new user
  const insertQuery = 'INSERT INTO employees (Id, username, password, departmentID) VALUES (?, ?, ?, ?)';
  connection.query(insertQuery, [id, username, password, departmentID], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ error: 'Error inserting data' });
      return;
    }
    res.status(200).json({ success: true, message: 'User added successfully' });
  });
});
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error clearing session:', err);
      res.status(500).json({ error: 'Error clearing session' });
      return;
    }
    res.status(200).json({ success: true, message: 'Session cleared successfully' });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Search for username and password in the database
  const selectQuery = 'SELECT * FROM employees WHERE username = ? AND password = ?';
  connection.query(selectQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error searching for user:', err);
      res.status(500).json({ error: 'Error searching for user' });
      return;
    }

    if (result.length > 0) {
      // Create session variable "loggedin" with true value
      req.session.loggedin = true;

      // Add current date to the "Log" table in MySQL DB format
      const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const insertQuery = 'INSERT INTO log (username, LoginDate) VALUES (?, ?)';
      connection.query(insertQuery, [currentDate, username], (err, result) => {
        if (err) {
          console.error('Error inserting data into Log table:', err);
          res.status(500).json({ error: 'Error inserting data into Log table' });
          return;
        }
      });

      res.status(200).json({ success: true });
    } else {
      res.status(200).json({ success: false });
    }
  });
});

  

  const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server running on port', PORT);
  console.log("http://localhost:3000");
});
  

