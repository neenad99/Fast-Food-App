import express from 'express';
import logger from 'morgan';
import path from 'path';
import upload from './helpers/upload';
import AuthC from './controllers/authController';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
// import superadmin from './routes/mainAdminRoute';
const passport = require('passport');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
dotenv.config();
let instance = new Razorpay({
  key_id: process.env.RAZOR_PAY_KEYID, // your `KEY_ID`
  key_secret: process.env.RAZOR_PAY_KEYSECRET // your `KEY_SECRET`
});

export default (orderC, userC, menuC) => {
  const server = express();
  const prefix = '/api/v1';

  /** TOP LEVEL MIDDLEWARES ** */
  server.use(logger('dev'));
  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  server.use(passport.initialize());


  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:9999/googleRedirect"
  },
  function(accessToken, refreshToken, profile, cb) {
      //console.log(accessToken, refreshToken, profile)
      console.log("GOOGLE BASED OAUTH VALIDATION GETTING CALLED")
      return cb(null, profile)
  }
));


// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,//process.env['FACEBOOK_CLIENT_ID'],
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,//process.env['FACEBOOK_CLIENT_SECRET'],
//     callbackURL: "http:localhost:9999/facebookRedirect", // relative or absolute path
//     profileFields: ['id', 'displayName', 'email', 'picture']
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     console.log(profile);
//     console.log("FACEBOOK BASED OAUTH VALIDATION GETTING CALLED")
//     return cb(null, profile);
//   }));

passport.serializeUser(function(user, cb) {
    console.log('serialized user');
    cb(null, user);
});
  
  passport.deserializeUser(function(obj, cb) {
    console.log('deserialized user');
    cb(null, obj);
});


//super admin routes
server.get(`${prefix}/vendor`,(req,res)=>{
  resC.read().then((resp)=>{
    console.log(resp);
    res.status(200);
    res.setHeader('Content-Type','application/json');
    res.json({status:"successful",statuscode:200,message:"retrieved the restaurants"});
}).catch((err)=>{console.log('failed to read restaurants\n',err)});
});


  // GET /orders
  server.get(`${prefix}/orders`, AuthC.verifyAdminToken, (_req, res) => {
    orderC.read().then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(500)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  // GET /orders/lifetimeSales
  server.get(`${prefix}/orders/lifetimeSales`, AuthC.verifyAdminToken, (req, res) => {
    orderC.getSales().then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(404)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  // GET /orders/dailySales/:date
  server.get(`${prefix}/orders/dailySales/:date`, AuthC.verifyAdminToken, (req, res) => {
    orderC.getSales(req).then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(404)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  // GET /orders:orderId
  server.get(`${prefix}/orders/:orderId`, AuthC.verifyAdminToken, (req, res) => {
    orderC.read(req).then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(404)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  // POST /orders
  server.post(`${prefix}/orders`, AuthC.verifyToken, (req, res) => orderC.create(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500)
      .json({ status: 'fail', error: err.message || err.error })));
  // PUT /orders/:orderId
  server.put(`${prefix}/orders/:orderId`, AuthC.verifyAdminToken, (req, res) => {
    orderC.updateStatus(req)
      .then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(400)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  // DELETE /orders/:orderId
  // server.delete(`${prefix}/orders/:orderId`, (req, res) => orderC.delete(req)
  // .then(result => res.status(200).json(result))
  // .catch(() => res.sendStatus(404)));
  server.delete(`${prefix}/orders/:orderId`, AuthC.verifyAdminToken, (req, res) => orderC.deleteOrder(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500).json(err)));

    //payment routes

    server.post(`${prefix}/orders/payment`,AuthC.verifyToken,(req,res)=>{
      // params=req.body;
      instance.orders.create(req.body).then((data) => {
      res.send({"sub":data,"status":"success"});
      }).catch((error) => {
      res.send({"sub":error,"status":"failed"});
      });
    });

    server.post(`${prefix}/orders/payment/verify`,AuthC.verifyToken,(req,res)=>{
      var body=req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id;
      var crypto = require("crypto");
      var expectedSignature = crypto.createHmac('sha256', 'k1BkS0ulAFGzhnCd1v3a6CvO').update(body.toString()).digest('hex');
      var response = {"status":"failure"}
      if(expectedSignature === req.body.razorpay_signature){
        response={"status":"success"};
      }
    res.send(response);
    });

  // ****** USER ROUTES **** //
  // passport oauth routes

  server.get('/auth/google',  passport.authenticate('google', { scope: ['profile','email'] }));
  // server.get('/auth/facebook',  passport.authenticate('facebook', {scope:'email'}));

  server.get('/googleRedirect', passport.authenticate('google'),(req, res)=>{
    console.log('redirected', req.user)
    let user = {
        id: req.user.id,
        username: req.user.name.givenName,
        email: req.user._json.email,
        provider: req.user.provider,
       displayName:req.user.displayName};
    console.log(user);

    userC.createOrFind(user).then((info)=>{
         res.cookie('userid',info.id);
         res.cookie('name',user.displayName);
         res.cookie('email',user.email);
         res.cookie('username',user.username);
         res.cookie('jwt',info.token);
         res.sendFile(`${uiPath}/templates/userMenu.html`);
    }).catch((err)=>{console.log('failed to create token')});
});
// server.get('/facebookRedirect', passport.authenticate('facebook', {scope: 'email'}),(req, res)=>{
//     console.log('redirected', req.user)
//     let user = {
//         id:req.user.id,
//         username: req.user.displayName,
//         email: req.user._json.email||(req.user.displayName+"@facebook.com"),
//         provider: req.user.provider };
//     var temp = user.username;
//     temp = temp.substring(0,temp.indexOf(' '));
//     console.log(temp);
//     console.log(user.email);
//     user.username = temp;
//     userC.createOrFind(user).then((info)=>{
//       res.cookie('userid',info.id);
//       res.cookie('name',user.username);
//       res.cookie('email',user.email);
//       res.cookie('username',user.username);
//       res.cookie('jwt',info.token);
//       res.sendFile(`${uiPath}/templates/userMenu.html`);
//  }).catch((err)=>{console.log('failed to create token')});
// });

// sign up routes
  server.post(`${prefix}/auth/signup`, (req, res) => userC.create(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500)
      .json({ status: 'fail', error: err.message || err.error })));

  // LOGIN /user
  server.post(`${prefix}/auth/login`, (req, res) => userC.login(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500)
      .json({ status: 'fail', error: err.message || err.error })));

  // GET /user/info
  server.post(`${prefix}/users/info`, AuthC.verifyAdminToken, (req, res) => userC.info(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500)
      .json({ status: err.statusCode, error: err.error || err.message })));

  // GET all order-history by userId
  server.get(`${prefix}/users/:userId/orders`, AuthC.verifyToken, (req, res) => userC.findOrdersByUserId(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500)
      .json({ status: err.statusCode, error: err.error || err.message })));

  server.get(`${prefix}/users`, AuthC.verifyAdminToken, (_req, res) => userC.read().then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(500).json({ status: 'fail', message: err.error || err.message })));


  // ****** MENU ROUTES **** //
  server.get(`${prefix}/menu`, AuthC.verifyToken, (_req, res) => menuC.read()
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500).json(err)));

  server.post(`${prefix}/menu`, AuthC.verifyAdminToken, upload.single('img'), (req, res) => menuC.create(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500).json(err)));

  server.put(`${prefix}/menu/:foodId`, AuthC.verifyAdminToken, upload.single('img'), (req, res) => {
    menuC.update(req)
      .then(result => res.status(result.statusCode).json(result))
      .catch(err => res.status(err.statusCode || 500)
        .json({ status: 'fail', message: err.error || err.message }));
  });

  server.delete(`${prefix}/menu/:foodId`, AuthC.verifyAdminToken, (req, res) => menuC.delete(req)
    .then(result => res.status(result.statusCode).json(result))
    .catch(err => res.status(err.statusCode || 500).json(err)));


  server.get('/api/v1', (req, res) => res.status(200).json({ message: 'Welcome to API version 1 of FastFoodFast' }));

  // ==========POWER FRONT-END PAGES===============//
  const uiPath = path.join(__dirname, '../../UI');
  server.use(express.static(uiPath));
  server.use('/uploads', express.static('uploads'));

  server.get('/', (_req, res) => {
    res.sendFile(`${uiPath}/templates/index.html`);
  });
  server.get('/index', (_req, res) => {
    res.sendFile(`${uiPath}/templates/index.html`);
  });
  server.get('/userIndex', (_req, res) => {
    res.sendFile(`${uiPath}/templates/userIndex.html`);
  });

  server.get('/menu', (_req, res) => {
    res.sendFile(`${uiPath}/templates/menu.html`);
  });
  server.get('/userMenu', (_req, res) => {
    res.sendFile(`${uiPath}/templates/userMenu.html`);
  });

  server.get('/signup', (_req, res) => {
    res.sendFile(`${uiPath}/templates/signup.html`);
  });
  server.get('/login', (_req, res) => {
    res.sendFile(`${uiPath}/templates/login.html`);
  });
  server.get('/admin', (_req, res) => {
    res.sendFile(`${uiPath}/templates/admin.html`);
  });
  server.get('/history', (_req, res) => {
    res.sendFile(`${uiPath}/templates/history.html`);
  });

  // CATCH ALL OTHER ROUTES
  server.get('*', (req, res) => res.status(404).json({ message: 'Welcome to Fast Food Fast', error: 'Sorry, this route is not available' }));
  server.post('*', (req, res) => res.status(404).json({ message: 'Welcome to Fast Food Fast', error: 'Sorry, this route is not available' }));

  return server;
};
