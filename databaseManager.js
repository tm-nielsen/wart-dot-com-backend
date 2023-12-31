const Database = require('better-sqlite3')
const resetJson = require('./prompts-18-09-23.json')

const dotenv = require('dotenv')
dotenv.config()

let isDebugging = process.argv.includes('debug')
const db = Database('prompts.db', isDebugging? { verbose: console.log }: undefined)


const createTable = () => {
    try {
    db.prepare('CREATE TABLE IF NOT EXISTS prompts(' +
        'prompt TEXT NOT NULL PRIMARY KEY,' +
        'category TEXT NOT NULL,' +
        "insertionDate INTEGER DEFAULT (unixepoch('now'))," +
        'selectionDate INTEGER DEFAULT 0,' +
        'endorsements INTEGER DEFAULT 1);').run()
    } catch(error) {console.error(error)}
}
exports.initializeDatabase = createTable
exports.closeDatabase = () => db.close()


exports.resetDatabase = () => {
    console.log('resetting database with dated json')
    db.prepare('DROP TABLE IF EXISTS prompts').run()
    createTable()

    const statement = db.prepare('INSERT INTO prompts ' +
        '(prompt, category, insertionDate, selectionDate) VALUES (?, ?, ?, ?)')
    const insertRow = (promptObject, categoryName) => {
        const {prompt, insertionDate, selectionDate} = promptObject
        let insertionEpoch = new Date(insertionDate).getTime() / 1000
        let selectionEpoch = new Date(selectionDate).getTime() / 1000
        statement.run(prompt, categoryName, insertionEpoch, selectionEpoch)
    }

    Object.keys(resetJson).map((categoryName) => {
        let categoryContent = resetJson[categoryName]

        if (Array.isArray(categoryContent)){
            categoryContent.map((promptObject) => {
                insertRow(promptObject, categoryName)
            })
        }
        else {
            insertRow(categoryContent, categoryName)
        }
    })
    console.log('database reset completed')


    const testPrompt = (target, label) => {
        console.log('\ntesting database entry for', label)
        let testStatement = db.prepare('SELECT * FROM prompts WHERE prompt = ?')
        let row = testStatement.get(target)
        let {prompt, category, insertionDate, selectionDate} = row
        console.log(`${prompt} (${category})`, '\n',
            new Date(insertionDate * 1000).toDateString(), '\n',
            new Date(selectionDate * 1000).toDateString())
    }

    testPrompt('Christmas', 'christmas 2021')
    testPrompt('Judgement', 'the 16/09/2023 prompt')
}


const getActivePrompt = () => {
    try {
        const statement = db.prepare("SELECT prompt FROM prompts WHERE category = 'active'")

        let row = statement.get()
        if (row && 'prompt' in row) return row.prompt
        return undefined
    }
    catch(err) {
        console.error(err)
        return undefined
    }
}
exports.getActivePrompt = getActivePrompt

const getPromptsInCategory = (categoryName, orderBySelectionDate = false) => {
    try {
        const statement = db.prepare('SELECT * FROM prompts WHERE category = ?' +
            ` ORDER BY ${orderBySelectionDate? 'selectionDate': 'insertionDate'} DESC`)

        let rows = statement.all(categoryName)
        return rows
    }
    catch(err) {
        console.error(err)
        return []
    }
}
exports.getPromptsInCategory = getPromptsInCategory


const insertPrompt = (prompt, category) => {
    try {
        const statement = db.prepare('INSERT INTO prompts (prompt, category) VALUES (?, ?)')
        statement.run(prompt, category)
    }
    catch(err) {
        console.error(err)
    }
}
exports.insertPrompt = insertPrompt

exports.addPendingPrompt = (prompt) => {
    insertPrompt(prompt, 'pending')
}

exports.endorsePrompt = (prompt) => {
    try {
        const statement = db.prepare('UPDATE prompts SET endorsements = endorsements + 1 WHERE prompt = ?')
        statement.run(prompt)
    }
    catch(err){
        console.error(err)
    }
}


const removePrompt = (prompt) => {
    try {
        const statement = db.prepare('DELETE FROM prompts WHERE prompt = ?')
        statement.run(prompt)
    }
    catch(err) {
        console.error(err)
    }
}
exports.removePrompt = removePrompt


const changePromptCategory = (prompt, newCategory) => {
    try {
        const statement = db.prepare('UPDATE prompts SET category = ? WHERE prompt = ?')
        statement.run(newCategory, prompt)
    }
    catch(err) {
        console.error(err)
    }
}

const updateSelectionDateToNow = (prompt) => {
    try {
        const statement = db.prepare('UPDATE prompts SET ' +
            "selectionDate = (unixepoch('now')) WHERE prompt = ?")
            statement.run(prompt)
    }
    catch(err) {
        console.error(err)
    }
}

//https://stackoverflow.com/questions/43566019/how-to-choose-a-weighted-random-array-element-in-javascript
const getRandomRowByWeight = (objectList) => {
    let i
    let weights = [objectList[0].endorsements]

    for (i = 1; i < objectList.length; i++)
        weights[i] = objectList[i].endorsements + weights[i - 1]

    let random = Math.random() * weights[weights.length - 1]

    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break
    
    return objectList[i]
}
const getRandomPromptFromCurrentPool = () => {
    try {
        const statement = db.prepare("SELECT * FROM prompts WHERE category = 'current'" +
            "ORDER BY endorsements DESC")
        let rows = statement.all()
        if (rows.length > 0) return getRandomRowByWeight(rows).prompt

        return undefined
    }
    catch(err) {
        console.error(err)
        return undefined
    }
}

exports.selectNewActivePrompt = () => {
    let activePrompt = getActivePrompt()
    if (activePrompt)
        changePromptCategory(activePrompt, 'past')

    let newActivePrompt = getRandomPromptFromCurrentPool()
    if (!newActivePrompt) {
        console.error('failed to select random prompt as new active, resetting to previous')
        changePromptCategory(activePrompt, 'active')
        return activePrompt
    }
    changePromptCategory(newActivePrompt, 'active')
    updateSelectionDateToNow(newActivePrompt)
    return newActivePrompt
}

exports.overrideActivePrompt = (prompt) => {
    try {
        const updateStatement = db.prepare("UPDATE prompts SET category = 'current' WHERE category = 'active'")
        updateStatement.run()

        const selectStatement = db.prepare('SELECT prompt FROM prompts WHERE prompt = ?')
        let row = selectStatement.get(prompt)

        if (row) changePromptCategory(prompt, 'active')
        else insertPrompt(prompt, 'active')
        updateSelectionDateToNow(prompt)
        return prompt
    }
    catch(err) {
        console.error(err)
        return undefined
    }
}


exports.setPromptEndorsements = (prompt, endorsements) => {
    try {
        const statement = db.prepare('UPDATE prompts SET endorsements = ? WHERE prompt = ?')
        statement.run(endorsements, prompt)
    }
    catch(err){
        console.error(err)
    }
}


exports.approvePrompts = (prompts) => {
    prompts.map((prompt) => {
        changePromptCategory(prompt, 'current')
    })
}

exports.rejectPrompts = (prompts) => {
    prompts.map((prompt) => {
        removePrompt(prompt)
    })
}
