const { createApp } = require('./app')
const {initializeDatabase, closeDatabase, resetDatabase} = require("./databaseManager")

const dotenv = require('dotenv')
dotenv.config()

if (process.argv.includes('reset')) resetDatabase()
else initializeDatabase()
process.on('exit', closeDatabase)

let allowedOrigin = process.env.FRONTEND_PATH
if (process.argv.includes('local')) allowedOrigin = 'http://localhost:3000'
const expressApp = createApp(allowedOrigin)
expressApp.listen(process.env.PORT)

console.log('express app listening on port', process.env.PORT,
'\nallowing access from', allowedOrigin,
'\nwith run args', process.argv.slice(2))