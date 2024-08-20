const express = require("express")
const PORT = 3384
const app = express()
const { LEVEL_OPTIONS, CALCULATE_SCORE } = require("./constants")
const { v4: uuid } = require("uuid")
app.use(express.json())

const state = {}

app.get("/state", (req, res) => {

    /*
        Debug only API, Requires a token "Dev_Secret_Key" from client to work.
    */

    const token = req.headers?.authorization?.split(" ")[1]

    if (!token) {
        res.status(401).json({
            msg: "Unauthorized Access: Auth Token Required."
        })
    }

    if (token != "Dev_Secret_Key") {
        res.status(401).json({
            msg: "Unauthorized Access: Invalid Token."
        })
    }

    const { userId } = req.body

    if (!userId) {
        res.status(401).json({
            msg: "Missing required params."
        })
    }

    res.json({
        state: state[userId]
    })
})

app.post("/start-game", (req, res) => {
    const { difficulty } = req.body

    if (!difficulty)
        res.status(400).json({
            msg: "difficulty is a mandatory param.",
        })

    const current_difficulty = LEVEL_OPTIONS[difficulty.toUpperCase()]

    if (!current_difficulty)
        res.status(400).json({
            msg: "difficulty provided is invalid, It should be either Easy, Medium or Hard.",
        })

    const userId = uuid()

    state[userId] = {
        startedAt: Date.now(),
        difficulty,
        n: Math.floor(Math.random() * current_difficulty.upperLimit + 1),
        attempts_left: current_difficulty.maxAttempts,
    }

    res.status(200).json({
        msg: "Game started.",
        userId,
    })
})

app.post("/guess", (req, res) => {
    const { guess, userId } = req.body

    if (!userId || !guess) {
        res.status(400).json({
            msg: "Mandatory param(s) are missing, guess or userId.",
        })
    }

    const user = state[userId]

    const selected_difficulty = LEVEL_OPTIONS[user.difficulty.toUpperCase()]

    if (user.attempts_left < 1) {

        const { finalScore, totalTimeTaken } = CALCULATE_SCORE({ user, selected_difficulty })

        res.status(400).json({
            msg: `Game over! The correct number was ${user.n}.`,
            score: finalScore,
            attempts_left: user.attempts_left,
            totalTimeTaken
        })

        state[userId] = {}
    }

    user.attempts_left += -1

    if (guess == user.n) {
        const { finalScore, totalTimeTaken } = CALCULATE_SCORE({ user, selected_difficulty })

        res.json({
            msg: "Congratulations! You've guessed the number.",
            score: finalScore,
            attempts_left: user.attempts_left,
            totalTimeTaken
        })

        state[userId] = {}
    }

    if (guess > user.n) {
        res.json({
            msg: "Too high! Try again.",
            attempts_left: user.attempts_left,
        })
    }

    else if (guess < user.n) {
        res.json({
            msg: "Too low! Try again.",
            attempts_left: user.attempts_left,
        })
    }


})

app.listen(PORT, () => console.log(`Server running on port : ${PORT}`))
