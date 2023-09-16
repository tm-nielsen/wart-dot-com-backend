const Express = require('express')
const {getActivePrompt, getPromptsInCategory} = require('./databaseManager')


exports.createApp = (isDebugging = false) => {
    const app = Express()

    app.use((req, res, next)=>{
        let allowedOrigin = 'https://tm-nielsen.github.io/wart-dot-com/'
        if (isDebugging)
            allowedOrigin = 'http://localhost:3000'
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'content-type');
        next();
    })


    app.get('/', (req, res) =>{
        res.send("Hello World")
    })

    app.get('/active', (req, res) => {
        getActivePrompt((activePrompt) => {
            res.send(activePrompt? activePrompt: '---')
        }, isDebugging)
    })

    app.get('/category/:categoryName', (req, res) => {
        const categoryName = req.params.categoryName
        getPromptsInCategory(categoryName, (prompts, promptCount) => {
            if (promptCount > 0)
                res.json(prompts)
            else
                res.send('invalid category')
        }, isDebugging)
    })

    app.post('/', (req, res) => {
        res.send('received post request')
    })

    app.patch('', (req, res) => {
        res.send('received patch request')
    })

    app.delete('', (req, res) => {
        res.send('received delete request')
    })

    return app
}