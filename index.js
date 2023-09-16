const { createApp } = require('./app.js')

const dotenv = require('dotenv')
dotenv.config()

const expressApp = createApp(process.argv[2])
expressApp.listen(process.env.PORT)
console.log('express app listening on ', process.env.PORT)
console.log(process.argv[2])