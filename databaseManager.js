const Database = require('better-sqlite3')
const testData = require('./testData.json')

const dotenv = require('dotenv')
dotenv.config()

let isDebugging = process.argv.includes('debug')
const db = Database('prompts.db', isDebugging? { verbose: console.log }: undefined)


const createTable = () => {
    db.prepare('CREATE TABLE IF NOT EXISTS prompts(' +
        'prompt TEXT NOT NULL PRIMARY KEY,' +
        'category TEXT NOT NULL);').run()
}
exports.initializeDatabase = createTable
exports.closeDatabase = () => db.close()


exports.resetDatabase = () => {
    console.log('resetting database with test Data')
    db.prepare('DROP TABLE IF EXISTS prompts').run()
    createTable()

    const statement = db.prepare('INSERT INTO prompts (prompt, category) VALUES (?, ?)')
    Object.keys(testData).map((categoryName) => {
        let categoryContent = testData[categoryName]

        if (Array.isArray(categoryContent)){
            categoryContent.map((prompt) => {
                statement.run(prompt, categoryName)
            })
        }
        else {
            statement.run(categoryContent, categoryName)
        }
    })
    console.log('database reset completed')
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

exports.getPromptsInCategory = (categoryName) => {
    try {
        const statement = db.prepare('SELECT prompt FROM prompts WHERE category = ?')

        let rows = statement.all(categoryName)
        return rows.map((row) => row.prompt)
    }
    catch(err) {
        console.error(err)
        return []
    }
}


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

const getRandomPromptFromCurrentPool = () => {
    try {
        const statement = db.prepare('SELECT prompt FROM prompts WHERE ' +
            "category = 'current' ORDER BY RANDOM() LIMIT 1")

        let row = statement.get()
        if (row && 'prompt' in row) return row.prompt
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
    return newActivePrompt
}

exports.overrideActivePrompt = (prompt) => {
    try {
        const statement = db.prepare("UPDATE prompts SET category = 'current' WHERE category = 'active'")
        statement.run()

        insertPrompt(prompt, 'active')
        return prompt
    }
    catch(err) {
        console.error(err)
        return undefined
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
