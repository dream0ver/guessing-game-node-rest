const LEVEL_OPTIONS = {
    "EASY": {
        upperLimit: 50,
        maxAttempts: 15,
        baseScore: 1000,
        penalty: {
            perGuess: 20,
            perSecond: 2
        },
        winBonus: 100
    },
    "MEDIUM": {
        upperLimit: 100,
        baseScore: 1500,
        maxAttempts: 10,
        penalty: {
            perGuess: 30,
            perSecond: 3
        },
        winBonus: 150
    },
    "HARD": {
        baseScore: 2000,
        upperLimit: 200,
        maxAttempts: 7,
        penalty: {
            perGuess: 50,
            perSecond: 5
        },
        winBonus: 200
    },

}

const CALCULATE_SCORE = ({ user, selected_difficulty }) => {

    /*
        Scoring Algorithm
        Score=Base Score−(Penalty per Guess×Number of Guesses)−(Penalty per Second×TimeTaken)+Win Bonus
    */

    const { attempts_left, startedAt } = user

    const { baseScore, winBonus, maxAttempts, penalty } = selected_difficulty

    const endedAt = Date.now()

    const totalGuessPenalty = (maxAttempts - attempts_left) * penalty.perGuess

    const totalTimeTaken = Math.floor((endedAt - startedAt) / 1000)

    const totalTimePenalty = totalTimeTaken * penalty.perSecond

    const finalScore = baseScore - totalGuessPenalty - totalTimePenalty + winBonus

    return {
        finalScore,
        totalTimeTaken
    }
}


module.exports = { LEVEL_OPTIONS, CALCULATE_SCORE }