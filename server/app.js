import express from 'express';
import { join } from 'path';
import favicon from 'serve-favicon';
import logger from 'morgan';
import { json, urlencoded } from 'body-parser';
import session from 'express-session';
import flash from 'connect-flash';
import routes from './routes';

const staticRoot = join(__dirname, '..', 'public');
const app = express();

/*
 * View engine setup
 * */
app.set('views', join(__dirname, '..', 'views'));
app.set('view engine', 'pug');

app.use(favicon(join(staticRoot, 'images', 'favicon.png')));
app.use(logger('dev'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(
  session({
    /*
     * This string is not an appropriate value for a production environment; read the
     * express-session documentation for details
     * */
    secret: '---',
    saveUninitialized: true,
    resave: true
  })
);
app.use(express.static(staticRoot));
app.use(flash());

app.use('/', routes);

/*
 * catch 404 and forward to error handler
 * */
app.use((req, res, next) => {
  const err = new Error('Not Found');

  err.status = 404;
  next(err);
});

/*
 * Error handlers
 * */

/*
 * Development error handler—will print stacktrace
 * */
if (app.get('env') === 'development') {
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.render('error', { message: error.message, error });
  });
}

/*
 * Production error handler—no stacktraces leaked to user
 * */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

export default app;
