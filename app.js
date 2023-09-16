const Express = require('express')
const testData = require('./testData')


exports.createApp = (runArgument) => {
    const app = Express()

    app.use((req, res, next)=>{
        let allowedOrigin = 'https://tm-nielsen.github.io/wart-dot-com/'
        if (runArgument === 'debug')
            allowedOrigin = 'http://localhost:3000'
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    })


    app.get('/', (req, res) =>{
        res.send("Hello World")
    })

    app.get('/active', (req, res) => {
        var activePrompt = testData['active']
        res.send(activePrompt)
    })

    app.get('/category/:categoryName', (req, res) => {
        var categoryName = req.params.categoryName
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

    app.delete('', (req, res) => {
        res.send('recieved delete request')
    })

    return app
}