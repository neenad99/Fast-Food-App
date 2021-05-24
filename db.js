const { Client,Pool} = require('pg');
const dotenv = require('dotenv'); 

dotenv.config();

const pool = new Pool({
    connectionString:process.env.DB_URL_LOCAL
});

// const pool = new Pool({
//   user:'isckon',
//   host:'isckon-food-app.cumevpjrfaxh.ap-south-1.rds.amazonaws.com',
//   database:'isckon-food-app',
//   password:'kc07aOUY8TdYR5G5Bx20',
//   port:5432
// });

pool.on('connect',()=>{
    console.log('db connnected');
});

const execute = (table,queryText)=>{
  pool.query(queryText)
      .then((res) => {
        console.log(`created ${table} table!`, res);
        pool.end();
      })
      .catch((err) => {
        console.log(`err in creating ${table} table`, err);
        pool.end();
      });
}

module.exports = {
createFoodItemsTable:()=> {
    const queryText = `CREATE TABLE IF NOT EXISTS
        menuitem(
          id VARCHAR(20) PRIMARY KEY,
          menuid VARCHAR(20) NOT NULL,
          categoryid VARCHAR(20) NOT NULL,
          name VARCHAR(128) UNIQUE NOT NULL,
          description VARCHAR(128) UNIQUE NOT NULL,
          price DECIMAL NOT NULL,
          img VARCHAR(128),
          minQty INTEGER NOT NULL,
          maxQty INTEGER NOT NULL,
          availablestarttime TIME NOT NULL,
          availableendtime TIME NOT NULL,
          isdisabled BOOLEAN NOT NULL,
          isekadashiitem BOOLEAN NOT NULL,
          ingredients VARCHAR(128),
          created_date TIMESTAMP default NOW(),
          modified_date TIMESTAMP default NOW(),
          foreign key(menuid) references menu(id) on delete cascade,
          foreign key(categoryid) references menuitemcategory(id) on delete cascade
        )`;
        execute("menuitem",queryText);
  },
  createcategorytable:()=>{
    const queryText = `CREATE TABLE IF NOT EXISTS
    menuitemcategory(
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(20) unique NOT NULL
    )`;
    execute("menuitemcategory",queryText);
  },
  createmenutable:()=>{
    const queryText = `
    create table if not exists
    menu(
      id varchar(20) primary key,
      restaurantid varchar(20) not null,
      menutypeid varchar(20) not null,
      starttime time not null,
      endtime time not null,
      created_date TIMESTAMP default NOW(),
      modified_date TIMESTAMP default NOW(),
      foreign key(restaurantid) references restaurant(id) on delete cascade,
      foreign key(menutypeid) references menutype(id) on delete cascade 
    )`;

    execute("menu",queryText);
  },
  createrestauranttable:()=>{
    const queryText=`
    create table if not exists
    restaurant(
      id varchar(20) primary key,
      typeid varchar(20) not null,
      name varchar(20) not null,
      description varchar(128) not null,
      address varchar(128) unique not null,
      city varchar(20) not null,
      state varchar(20) not null,
      rating integer not null,
      created_date TIMESTAMP default NOW(),
      modified_date TIMESTAMP default NOW(),
      foreign key(typeid) references restauranttype(id) on delete cascade
    )`;
    execute("restaurant",queryText);
  },
  createmenutypetable:()=>{
    const queryText=`
    create table if not exists
    menutype(
      id varchar(20) primary key,
      name varchar(20) unique not null
    )`;

    execute("menutype",queryText);
  },
  createrestauranttypetable:()=>{
    const queryText=`
    create table if not exists
    restauranttype(
      id varchar(20) primary key,
      name varchar(20) unique not null
    )`;

    execute("restauranttype",queryText);
  },
  createOrdersTable:()=> {
    // return new Promise((resolve, reject) => {
      const queryText = `CREATE TABLE IF NOT EXISTS
      orders(
        id varchar(20) PRIMARY KEY,
        userid varchar(20) NOT NULL,
        restaurantid varchar(20) NOT NULL,
        statusid varchar(20) not null,
        quantity INTEGER not null,
        amount decimal not null,
        tax decimal not null,
        deliverycharge decimal not null,
        discount decimal not null,
        reason varchar(120),
        comments varchar(120),
        created_date TIMESTAMP default NOW(),
        foreign key (userid) references users(id) on delete cascade,
        foreign key(restaurantid) references restaurant(id) on delete cascade,
        foreign key(statusid) references status(id) on delete cascade
      )`;
      execute("order",queryText);
  },
  createstatustable:()=>{
    const queryText=`
    create table if not exists
    status(
      id varchar(20) primary key,
      name varchar(20) unique not null
    )`;

    execute("status",queryText);
  },
  createorderitemtable:()=>{
    const queryText=`
    create table if not exists
    orderitem(
      orderid varchar(20),
      menuitemid varchar(20),
      primary key(orderid,menuitemid),
      foreign key(orderid) references orders(id) on delete cascade,
      foreign key(menuitemid) references menuitem(id) on delete cascade
    )`;

    execute("orderitem",queryText);
  },
  createusertable:()=> {
    const queryText=`
    create table if not exists
    users(
      id varchar(20) primary key,
      roleid varchar(20) not null,
      username varchar(20) not null,
      email varchar(20)  not null unique,
      password varchar(20) not null,
      phoneno varchar(20)  not null unique,
      address varchar(120) not null,
      foreign key(roleid) references role(id) on delete cascade
    )`;

    execute("users",queryText);
  },
  createroletable:()=>{
    const queryText=`
    create table if not exists
    role(
      id varchar(20) primary key,
      name varchar(20) not null unique
    )`;

    execute("role",queryText);
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