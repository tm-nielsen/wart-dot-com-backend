const express = require('express')
const {
    getActivePrompt, getPromptsInCategory,
    addPendingPrompt, endorsePrompt,
    approvePrompts, rejectPrompts,
    selectNewActivePrompt,
    setPromptEndorsements,
    insertPrompt, removePrompt, overrideActivePrompt
} = require('./databaseManager')


exports.createApp = (allowedOrigin) => {
    const app = express()
    app.enable('trust proxy')
    app.use(express.json())

    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] === 'http') {
            return res.redirect('https://' + req.headers.host + req.url)
        }
        next()
    })

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-type');
        next();
    })


    app.get('/status', (req, res) => {
        res.send("online")
    })

    app.get('/active', (req, res) => {
        let activePrompt = getActivePrompt()
        res.send(activePrompt? activePrompt: '---')
    })

    app.get('/category/:categoryName', (req, res) => {
        const categoryName = req.params.categoryName
        let prompts = getPromptsInCategory(categoryName, categoryName === 'past')
        res.json(prompts)
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
        addPendingPrompt(prompt)
        res.send(`added prompt "${prompt}"`)
    })

    app.patch('/endorse', (req, res) => {
        const {prompt} = req.body
        endorsePrompt(prompt)
        res.send(`endorsed prompt "${prompt}"`)
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

    app.patch('/approve', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {approvedPrompts} = req.body
            res.send(`received approval request for ${approvedPrompts}`)
            approvePrompts(approvedPrompts)
        }
    })

    app.patch('/reject', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {rejectedPrompts} = req.body
            res.send(`received rejection request for ${rejectedPrompts}`)
            rejectPrompts(rejectedPrompts)
        }
    })


    app.patch('/select', (req, res) => {
        if (authenticateRequest(req, res)) {
            let newActivePrompt = selectNewActivePrompt()
            res.send(`selected new active prompt: ${newActivePrompt}`)
        }
    })

    app.patch('/override', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt} = req.body
            let newActivePrompt = overrideActivePrompt(prompt)
            res.send(`active prompt overriden to: ${newActivePrompt}`)
        }
    })


    app.patch('/set-endorsements', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt, endorsements} = req.body
            setPromptEndorsements(prompt, endorsements)
            res.send(`set "${prompt}" endorsement level to ${endorsements}`)
        }
    })


    app.post('/insert', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt, category} = req.body
            insertPrompt(prompt, category)
            res.send(`inserted prompt ${prompt} into ${category}`)
        }
    })

    app.delete('/', (req, res) => {
        if (authenticateRequest(req, res)) {
            const {prompt} = req.body
            removePrompt(prompt)
            res.send(`deleted prompt ${prompt}`)
        }
    })

    return app
}