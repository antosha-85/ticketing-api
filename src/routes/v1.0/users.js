const router = require("express").Router();

module.exports = db => {
<<<<<<< HEAD
  
  // New user
  router.post("/signup", (request, response) => {
    db.query(`
      select addUser($1, $2, $3, $4) as handle;
     `, [request.body.first_name, request.body.last_name, request.body.email, request.body.password])
     .then(({ rows: users }) => { response.json(users) })
     .catch(e => console.error(e.stack));
=======

  router.put("/signup", (request, response) => {
    db.query(`SELECT COUNT(id) as total FROM users WHERE email = $1`, [request.body.email])
    .then(({rows}) => { 
      if (rows[0].total == 0) {
        db.query(`
          INSERT INTO users (first_name, last_name, email, password) 
          VALUES ($1, $2, $3, $4) RETURNING *;
         `, [request.body.first_name, request.body.last_name, request.body.email, request.body.password])
         .then(({ rows: users }) => { response.status(201).json(users) })
         .catch(e => console.error(e.stack));
      } else {
        response.status(409).json({message: `User already registered`});
      }
    })
>>>>>>> routes
  });

  // select * from users where email = 'john@fake.com' and password = '123'
  // User login
  router.post("/login", (request, response) => {
<<<<<<< HEAD
    db.query(`SELECT handle, id, first_name, last_name, email FROM users WHERE email = $1 and password = $2;`
      , [ request.body.email, request.body.password ])
    .then(({ rows: users }) => {
      if (users.length !== 0) {
        response.json(users) 
      } else {
        response.status(404).json({message: "User not found. Please, verify the email and password provided."})
      }
    })
    .catch(e => console.error(e.stack));
    });
=======
    console.log("Check:", request.body);
    db.query(`
      SELECT * FROM users WHERE email = $1 and password = $2;
     `, [ request.body.email,
          request.body.password ])
     .then(({ rows: users }) => { response.status(200).json(users) })
     .catch(e => console.error(e.stack));
  });
>>>>>>> routes

  // User update
  router.patch("/user/:id", (request, response) => {
    db.query(`
      UPDATE users
      SET first_name = $2, last_name = $3, email = $4, password = $5
      WHERE handle = $1 RETURNING *;
     `, [
        request.params.id,
        request.body.first_name,
        request.body.last_name,
        request.body.email,
        request.body.password
     ])
     .then(({ rows: users }) => { response.status(200).json(users) })
     .catch(e => console.error(e.stack));
  });

  return router;
};
