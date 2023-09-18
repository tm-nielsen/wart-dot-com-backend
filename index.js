const { createApp } = require('./app')
const {initializeDatabase, closeDatabase, resetDatabase} = require("./databaseManager")

const dotenv = require('dotenv')
dotenv.config()

if (process.argv.includes('reset')) resetDatabase()
else initializeDatabase()
process.on('exit', closeDatabase)

const expressApp = createApp(process.argv.includes('debug'))
expressApp.listen(process.env.PORT)

console.log('express app listening on', process.env.PORT, process.argv.slice(2))