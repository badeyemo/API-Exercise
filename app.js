const express   = require('express'),
    app         = express(),
    userRoutes  = require('./routes/users'),
    bodyParser  = require('body-parser');

app.use(bodyParser.json());
app.use('/users', userRoutes);

app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    return next(err);
});

if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        return res.json({
            message: err.message,
            error: err
        });
    });
};


module.exports = app;
