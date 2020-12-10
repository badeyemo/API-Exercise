process.env.NODE_ENV = "test";

const db        = require('../db'),
    request     = require('supertest'),
    app         = require('../app'),
    jwt         = require('jsonwebtoken'),
    bcrypt      = require('bcrypt');


let auth = {};

beforeAll(async () => {
    await db.query("CREATE TABLE users (id SERIAL PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, isadmin BOOLEAN DEFAULT false);");
});

beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('SECRET', 1);
    await db.query("INSERT INTO users (username, password, isadmin) VALUES ('test', $1, true);", [hashedPassword]);

    const response = await request(app)
        .post('/users/auth')
        .send({
            username: 'test',
            password: 'secret',
            isadmin: true
        });
    auth.token = response.body.token;
    auth.current_user_id = jwt.decode(auth.token).user_id;
});

afterEach(async () => {
    await db.query('DELETE FROM users');
});

afterAll(async () => {
    await db.query('DROP TABLE users');
    db.end();
});


describe(' GET /users', () => {
    test('Returns a list of users', async () => {
        const response = await request(app).get("/users").set("authorization", auth.token);
        expect(response.body.length).toBe(1);
        expect(response.statusCode).toBe(200)
    });
});

describe(' GET /users without auth', () => {
    test('requires login', async () => {
        const response = await request(app).get("/users/");
        expect(response.body.message).toBe('Unauthorized');
        expect(response.statusCode).toBe(401)
    });
});

describe(' GET /users without auth', () => {
    test('requires login', async () => {
        const response = await request(app).get("/users/");
        expect(response.body.message).toBe('Unauthorized');
        expect(response.statusCode).toBe(401)
    });
});

describe(' GET /secure/:id', () => {
    test('authorizes only correct users', async () => {
        const response = await request(app).get("/users/secure/100").set("authorization", auth.token)
        expect(response.body.message).toBe('Unauthorized');
        expect(response.statusCode).toBe(401)
    });
});

describe(' GET /secure/:id', () => {
    test('authorizes only correct users', async () => {
        const response = await request(app)
            .get(`/users/secure/${auth.current_user_id}`)
            .set("authorization", auth.token)
        expect(response.body.message).toBe('You made it');
        expect(response.statusCode).toBe(200)
    });
}); 