const Database = require('better-sqlite3')
const testData = require('./testData.json')

const db = Database('prompts.db', { verbose: console.log })


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
    const statement = db.prepare('SELECT prompt FROM prompts WHERE category = ?')
    return statement.get('active').prompt
}
exports.getActivePrompt = getActivePrompt

exports.getPromptsInCategory = (categoryName) => {
    const statement = db.prepare('SELECT prompt FROM prompts WHERE category = ?')

    let rows = statement.all(categoryName)
    return rows.map((row) => row.prompt)
}


const insertPrompt = (prompt, category) => {
    const statement = db.prepare('INSERT INTO prompts (prompt, category) VALUES (?, ?)')
    statement.run(prompt, category)
}
exports.insertPrompt = insertPrompt

exports.addPendingPrompt = (prompt) => {
    insertPrompt(prompt, 'pending')
}

const removePrompt = (prompt) => {
    const statement = db.prepare('DELETE FROM prompts WHERE prompt = ?')
    statement.run(prompt)
}
exports.removePrompt = removePrompt


const changePromptCategory = (prompt, newCategory) => {
    const statement = db.prepare('UPDATE prompts SET category = ? WHERE prompt = ?')
    statement.run(newCategory, prompt)
}

const getRandomPromptFromCurrentPool = () => {
    const statement = db.prepare('SELECT prompt FROM prompts WHERE ' +
        "category = 'current' ORDER BY RANDOM() LIMIT 1")
    return statement.get().prompt
}

exports.selectNewActivePrompt = () => {
    let activePrompt = getActivePrompt()
    changePromptCategory(activePrompt, 'past')

    activePrompt = getRandomPromptFromCurrentPool()
    changePromptCategory(activePrompt, 'active')
    return activePrompt
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
