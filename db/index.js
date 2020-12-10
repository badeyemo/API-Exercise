const { Client } = require('pg');
require('dotenv').config();

const db = process.env.NODE_ENV === 'test' ? 'users-test' : 'users';

const config = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    database: db,
    port: process.env.PGPORT
};

const client = new Client(config);

client.connect();

module.exports = client; 