const fs = require('fs')
const https = require('https')

let privateKey = fs.readFileSync('wartwords.ca.key', 'utf-8')
let certificate = fs.readFileSync('wartwords.ca.cert', 'utf-8')
let credentials = {key: privateKey, cert: certificate}


const { createApp } = require('./app')
const {initializeDatabase, closeDatabase, resetDatabase} = require("./databaseManager")

const dotenv = require('dotenv')
dotenv.config()


const runningLocally = process.argv.includes('local')
const port = process.env.PORT
let allowedOrigin = process.env.FRONTEND_PATH
if (runningLocally) allowedOrigin = 'http://localhost:3000'


if (process.argv.includes('reset')) {
    resetDatabase()
    closeDatabase()
    return
}
else initializeDatabase()
process.on('exit', closeDatabase)


const expressApp = createApp(allowedOrigin)
let httpsServer = https.createServer(credentials, expressApp)
httpsServer.listen(port)

console.log('\nhttps server listening on port', port,
'\nallowing access from', allowedOrigin,
'\nwith run args', process.argv.slice(2))