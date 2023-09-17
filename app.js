const express = require('express')
const {getActivePrompt, getPromptsInCategory, addPendingPrompt} = require('./databaseManager')


exports.createApp = (isDebugging = false) => {
    const app = express()
    app.use(express.json())

    app.use((req, res, next)=>{
        let allowedOrigin = 'https://tm-nielsen.github.io/wart-dot-com/'
        if (isDebugging)
            allowedOrigin = 'http://localhost:3000'
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-type');
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

    app.get('/authenticate/:password', (req, res) => {
        const password = req.params.password
        if (password === process.env.PASSWORD)
            res.send(true)
        else
            res.send(false)
    })


    app.post('/suggest', (req, res) => {
        const {prompt} = req.body
        addPendingPrompt(prompt, isDebugging)
        res.send(`added prompt "${prompt}"`)
    })


    const authenticateRequest = (req, res) => {
        const {password} = req.body
        if (password !== process.env.PASSWORD){
            res.status(401)
            res.send("unauthorized access")
            return false
        }
        return true
    }

    app.post('insert', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt, category} = req.body
            res.send(`inserted prompt ${prompt} into ${category}`)
        }
    })

    app.patch('/approve', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {approvedPrompts} = req.body
            res.send(`received approval request for ${approvedPrompts}`)
        }
    })

    app.patch('/reject', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {rejectedPrompts} = req.body
            res.send(`received rejection request for ${rejectedPrompts}`)
        }
    })

    app.patch('/select', (req, res) => {
        if (authenticateRequest(req, res)) {
            res.send('received request to select new prompt')
        }
    })

    app.delete('/', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt} = req.body
            res.send(`deleted prompt ${prompt}`)
        }
    })

    return app
}