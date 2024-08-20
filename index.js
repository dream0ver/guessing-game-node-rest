const PORT = 3384
const { app } = require("./app")
app.listen(PORT, () => console.log(`Server running on port : ${PORT}`))
