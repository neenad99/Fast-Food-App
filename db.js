const {Pool} = require('pg');
const dotenv = require('dotenv'); 

dotenv.config();

const pool = new Pool({
    connectionString:process.env.DB_URL_LOCAL
});

pool.on('connect',()=>{
    console.log('db connnected');
})

module.exports = {
createUsersTable:()=> {
    const queryText = `CREATE TABLE IF NOT EXISTS
        users(
          userId SERIAL PRIMARY KEY,
          username VARCHAR(128) UNIQUE NOT NULL,
          email VARCHAR(128) UNIQUE NOT NULL,
          password VARCHAR(128) NOT NULL,
          address TEXT,
          phone VARCHAR(20) UNIQUE,
          role VARCHAR(16) default 'user',
          created_date TIMESTAMP default NOW(),
          modified_date TIMESTAMP default NOW()
        )`;

    pool.query(queryText)
      .then((res) => {
        console.log('created users table!', res);
        pool.end();
      })
      .catch((err) => {
        console.log('err in creating users table', err);
        pool.end();
      });
  },
  createOrdersTable:()=> {
    // return new Promise((resolve, reject) => {
      const queryText = `CREATE TABLE IF NOT EXISTS
      orders(
        orderId SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        food VARCHAR(512) NOT NULL,
        quantity INTEGER,
        price INTEGER,
        address TEXT NOT NULL,
        email TEXT,
        phone VARCHAR (20),
        username VARCHAR (128),
        status VARCHAR(20),
        reason TEXT,
        created_date TIMESTAMP default NOW(),
        modified_date TIMESTAMP default NOW(),
        FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE

      )`;
      pool.query(queryText)
        .then((res) => {
          console.log('created orders table!: ', res);
          pool.end();
        })
        .catch((err) => {
          console.log(err);
          pool.end();
        });
    // });
  },
  createMenuTable:()=> {
    const queryText = `CREATE TABLE IF NOT EXISTS
      menu(
        foodId SERIAL PRIMARY KEY,
        name VARCHAR(128) UNIQUE NOT NULL,
        price INTEGER NOT NULL,
        genre VARCHAR(16) NOT NULL,
        img TEXT,
        description TEXT,
        isAvailable BOOLEAN,
        created_date TIMESTAMP DEFAULT NOW(),
        modified_date TIMESTAMP DEFAULT NOW()
      )`;

    pool.query(queryText)
      .then(res =>{
           console.log('created menu table!', res);
           pool.end();
        })
      .catch(err =>{ 
          console.log('err in creating menu table', err);
          pool.end();
    });
  },
  dropTable:(tableName)=> {
    const queryText = `DROP TABLE IF EXISTS ${tableName}`;
    pool.query(queryText)
      .then(() => {
        console.log(`dropped ${tableName} table`);
        pool.end();
      })
      .catch((err) => {
        console.log(`err in dropping ${tableName} table: ${err}`);
        pool.end();
      });
  }
}

require('make-runnable');