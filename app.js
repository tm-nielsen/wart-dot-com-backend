const Express = require('express')
const testData = require('./testData')

const app = Express()

app.get('/', (req, res) =>{
    res.send("Hello World")
})

app.get('/active', (req, res) => {
    var activePrompt = testData['active']
    res.send(activePrompt)
})

app.get('/category', (req, res) => {
    var categoryName = req.body
    if (categoryName in testData)
        res.send(JSON.stringify(testData[categoryName]))
    else
        res.send("invalid category")
})

app.post('/', (req, res) => {
    res.send("recieved post request")
})

app.patch('', (req, res) => {
    res.send("recieved patch request")
})


exports.expressApp = app