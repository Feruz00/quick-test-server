require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const errorHandler = require('./utils/errorHandler');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss');
const hpp = require('hpp');
const compression = require('compression');

const AppError = require('./utils/appError');

const app = express();

app.set('trust proxy', false);

app.use(cookieParser());

const allowedOrigins =
  process.env.NODE_ENV === 'production' ? '*' : ['http://localhost:5173'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(morgan('dev'));

app.use((req, res, next) => {
  if (req.body) req.body = JSON.parse(xss(JSON.stringify(req.body)));
  if (req.params) req.params = JSON.parse(xss(JSON.stringify(req.params)));
  if (req.query) {
    const sanitizedQuery = {};
    for (const key in req.query) {
      sanitizedQuery[key] = xss(req.query[key]);
    }
    req.query = sanitizedQuery;
  }
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: '50mb' }));

app.use(
  hpp({
    whitelist: ['page', 'limit'],
  })
);

app.use(compression());

app.use('/api/users', require('./routes/user'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/event', require('./routes/event'));
app.use('/api/event', require('./routes/event'));
app.use('/api/questions', require('./routes/questions'));

app.use('/api/participant', require('./routes/participant'));

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

module.exports = app;
