const { createApp } = require('./app')
const {initializeDatabase, closeDatabase, resetDatabase} = require("./databaseManager")

const dotenv = require('dotenv')
dotenv.config()


const runningLocally = process.argv.includes('local')
const port = process.env.PORT
let allowedOrigin = process.env.FRONTEND_PATH
if (runningLocally) allowedOrigin = 'http://localhost:3000'


if (process.argv.includes('reset')) resetDatabase()
else initializeDatabase()
process.on('exit', closeDatabase)


const expressApp = createApp(allowedOrigin)
expressApp.listen(port)

console.log('express app listening on port', port,
'\nallowing access from', allowedOrigin,
'\nwith run args', process.argv.slice(2))