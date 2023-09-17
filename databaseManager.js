const sqlite3 = require('sqlite3')
const testData = require('./testData.json')

const db = new sqlite3.Database('prompts.db')

const createTable = () => {
    db.run('CREATE TABLE IF NOT EXISTS prompts(' +
        'prompt TEXT NOT NULL PRIMARY KEY,' +
        'category TEXT NOT NULL);',
        (err) => {
            if (err) console.error(err)
    })
}

exports.initializeDatabase = createTable
exports.closeDatabase = () => db.close()


exports.resetDatabase = () => {
    console.log('resetting database with test Data')
    db.run('DROP TABLE IF EXISTS prompts')
    createTable()

    const statement = 'INSERT INTO prompts (prompt, category) VALUES (?, ?)'
    Object.keys(testData).map((categoryName) => {
        let categoryContent = testData[categoryName]

        if (Array.isArray(categoryContent)){
            categoryContent.map((prompt) => {
                db.run(statement, [prompt, categoryName])
            })
        }
        else {
            db.run(statement, [categoryContent, categoryName])
        }
    })
    console.log('database reset completed')
}


exports.getActivePrompt = (callback, logStatement = false) => {
    const statement = 'SELECT prompt FROM prompts WHERE category = "active"'

    if (logStatement)
        console.log('executing sql:\t\t', statement)

    db.get(statement, (err, row) => {
        if (err) console.error(err)
        callback(row.prompt)
    })
}

exports.getPromptsInCategory = (categoryName, callback, logStatement = false) => {
    const statement = 'SELECT prompt FROM prompts WHERE category = ?'

    if (logStatement)
        console.log('executing sql:\t\t', statement)

    let rows = []
    db.each(statement, [categoryName], (err, row) => {
        if (err) console.error(err)
        rows.push(row.prompt)
    }, (err, rowCount) => {
        if (err) console.error(err)
        callback(rows, rowCount)
    })
}


const run = (statement, parameters = [], logStatement = false) => {
    if (logStatement)
        console.log('executing sql:\t\t', statement)

    db.run(statement, parameters, (err) =>{
        if (err) console.error(err)
    })
}

exports.addPendingPrompt = (prompt, logStatement = false) => {
    const statement = 'INSERT INTO prompts (prompt, category) VALUES (?, "pending")'
    
    run(statement, [prompt], logStatement)
    // insertPrompt(prompt, 'pending')
}