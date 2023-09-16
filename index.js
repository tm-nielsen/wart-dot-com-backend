const { expressApp } = require('./app.js')

const dotenv = require('dotenv')
dotenv.config()


expressApp.listen(process.env.PORT)
console.log('express app listening on ', process.env.PORT)