const request = require('supertest');
const { app } = require("./app");
const { LEVEL_OPTIONS } = require('./constants');

describe('API Tests', () => {
    describe("1) POST /start-game", () => {
        test('When "difficulty" param is missing', async () => {
            const res = await request(app).post('/start-game').send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('msg', "difficulty is a mandatory param.");
        });
        test('When "difficulty" param is invalid', async () => {
            const res = await request(app).post('/start-game').send({ difficulty: "thisisnotavaliddifficultlylevel" });
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('msg', "difficulty provided is invalid, It should be either Easy, Medium or Hard.");
        });
        test('When "difficulty" param is valid', async () => {
            const res = await request(app).post('/start-game').send({ difficulty: "hard" });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('msg', "Game started.");
        });

    })
    describe("2) GET /state", () => {
        test('When Bearer token is missing', async () => {
            const res = await request(app).get('/state').send({});
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('msg', "Unauthorized Access: Auth Token Required.");
        });
        test('When Bearer token is invalid', async () => {
            const res = await request(app).get('/state').set('Authorization', `Bearer thisisainvalidauthtoken`).send({});
            expect(res.statusCode).toEqual(401);
            expect(res.body).toHaveProperty('msg', "Unauthorized Access: Invalid Token.");
        });
        test('When Bearer token is valid but no userId param in request', async () => {
            const res = await request(app).get('/state').set('Authorization', `Bearer Dev_Secret_Key`).send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty('msg', "Missing required params.");
        });
        test('When Bearer token is valid and req also contains userId', async () => {
            const res = await request(app).get('/state').set('Authorization', `Bearer Dev_Secret_Key`).send({ userId: "some_user_uuid" });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty("state");
            expect(typeof (res.body.state)).toBe("object")
        });
    })
    describe("3) POST /guess", () => {
        test("When userId or guess params are missing in request", async () => {
            const res = await request(app).post('/guess').send({})
            expect(res.statusCode).toEqual(400);
            expect(res.body).toHaveProperty("msg", "Mandatory param(s) are missing, guess or userId.")
        })
        describe("Start Game before each test", () => {
            let startGameResponse
            beforeEach(async () => {
                startGameResponse = await request(app).post('/start-game').send({ difficulty: "easy" })
            })
            test("When user has run out of attempt limit", async () => {
                const { maxAttempts, upperLimit } = LEVEL_OPTIONS["EASY"]
                const { userId } = startGameResponse.body
                let guessResponse
                for (let i = maxAttempts; i >= 0; i--) {
                    guessResponse = await request(app).post('/guess').send({
                        userId,
                        guess: upperLimit + 1
                    })
                }
                expect(guessResponse.statusCode).toEqual(200)
                expect(guessResponse.body.msg.startsWith("Game over")).toBe(true)
                expect(guessResponse.body).toHaveProperty("score")
                expect(guessResponse.body).toHaveProperty("attempts_left")
                expect(guessResponse.body).toHaveProperty("totalTimeTaken")
            })
            test("When user has guessed high", async () => {
                const { upperLimit } = LEVEL_OPTIONS["EASY"]
                const { userId } = startGameResponse.body
                let guessResponse = await request(app).post('/guess').send({
                    userId,
                    guess: upperLimit + 1
                })
                expect(guessResponse.statusCode).toEqual(200)
                expect(guessResponse.body).toHaveProperty("msg", "Too high! Try again.")
            })
            test("When user has guessed low", async () => {
                const { userId } = startGameResponse.body
                let guessResponse = await request(app).post('/guess').send({
                    userId,
                    guess: -1
                })
                expect(guessResponse.statusCode).toEqual(200)
                expect(guessResponse.body).toHaveProperty("msg", "Too low! Try again.")
            })
            test("When user has won the game", async () => {
                const { userId } = startGameResponse.body
                const { body: { state: { n } } } = await request(app).get("/state").set("Authorization", "Bearer Dev_Secret_Key").send({ userId })
                const guessResponse = await request(app).post("/guess").send({
                    userId,
                    guess: n
                })
                expect(guessResponse.body.msg.startsWith("Congratulations")).toBe(true)
                expect(guessResponse.body).toHaveProperty("score")
                expect(guessResponse.body).toHaveProperty("attempts_left")
                expect(guessResponse.body).toHaveProperty("totalTimeTaken")
            })
        })
    })
});
