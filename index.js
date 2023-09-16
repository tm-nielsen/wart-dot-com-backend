const { createApp } = require('./app')
const {initializeDatabase, closeDatabase, resetDatabase} = require("./databaseManager")

const dotenv = require('dotenv')
dotenv.config()

const runArgument = process.argv[2]

if (runArgument === 'reset') resetDatabase()
else initializeDatabase()
process.on('exit', closeDatabase)

const expressApp = createApp(runArgument === 'debug')
expressApp.listen(process.env.PORT)

console.log('express app listening on ', process.env.PORT, ' with argument ', runArgument)