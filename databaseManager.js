// const sqlite3 = require('sqlite3')
const Database = require('better-sqlite3')
const testData = require('./testData.json')

// const db = new sqlite3.Database('prompts.db')
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
                // insertStatement.run(prompt, categoryName)
                statement.run(prompt, categoryName)
            })
        }
        else {
            // insertStatement.run(categoryContent, categoryName)
            statement.run(categoryContent, categoryName)
        }
    })
    console.log('database reset completed')
}


const getActivePrompt = (callback, logStatement = false) => {
    // const statement = 'SELECT prompt FROM prompts WHERE category = "active"'
    const statement = db.prepare('SELECT prompt FROM prompts WHERE category = ?')

    // if (logStatement)
    //     console.log('executing sql:\t\t', statement)

    // db.get(statement, (err, row) => {
    //     if (err) console.error(err)
    //     callback(row.prompt)
    // })
    let row = statement.get('active')
    // let row = categorySelectStatement.get('active')
    console.log(row)
    callback(row.prompt)
}
exports.getActivePrompt = getActivePrompt

exports.getPromptsInCategory = (categoryName, callback, logStatement = false) => {
    // const statement = 'SELECT prompt FROM prompts WHERE category = ?'
    const statement = db.prepare('SELECT prompt FROM prompts WHERE category = ?')

    // if (logStatement)
    //     console.log('executing sql:\t\t', statement)

    // let rows = []
    // db.each(statement, [categoryName], (err, row) => {
    //     if (err) console.error(err)
    //     rows.push(row.prompt)
    // }, (err, rowCount) => {
    //     if (err) console.error(err)
    //     callback(rows, rowCount)
    // })
    let rows = statement.all(categoryName)
    // let rows = categorySelectStatement.all(categoryName)
    console.log(rows)
    let prompts = rows.map((row) => row.prompt)
    console.log(prompts)
    callback(prompts, prompts.length)
}


// const run = (statement, parameters = [], logStatement = false) => {
//     if (logStatement)
//         console.log('executing sql:\t\t', statement)

//     db.run(statement, parameters, (err) =>{
//         if (err) console.error(err)
//     })
// }

const insertPrompt = (prompt, category, logStatement = false) => {
    // const statement = 'INSERT INTO prompts (prompt, category) VALUES (?, ?)'
    // run(statement, [prompt, category], logStatement)
    const statement = db.prepare('INSERT INTO prompts (prompt, category) VALUES (?, ?)')
    statement.run(prompt, category)
    // insertStatement.run(prompt, category)
}
exports.insertPrompt = insertPrompt

exports.addPendingPrompt = (prompt, logStatement = false) => {
    insertPrompt(prompt, 'pending', logStatement)
}

const removePrompt = (prompt, logStatement = false) => {
    // const statement = 'DELETE FROM prompts WHERE prompt = ?'
    // run(statement, [prompt], logStatement)
    const statement = db.prepare('DELETE FROM prompts WHERE prompt = ?')
    statement.run(prompt)
    // removeStatement.run(prompt)
}
exports.removePrompt = removePrompt


const changePromptCategory = (prompt, newCategory, logStatement = false) => {
    // const statement = 'UPDATE prompts SET category = ? WHERE prompt = ?'
    // run(statement, [newCategory, prompt], logStatement)
    const statement = db.prepare('UPDATE prompts SET category = ? WHERE prompt = ?')
    statement.run(newCategory, prompt)
    // updateCategoryStatement.run(newCategory, prompt)
}

const getRandomPromptFromCurrentPool = (callback, logStatement = false) => {
    const statement = db.prepare('SELECT prompt FROM prompts WHERE category = "current" ORDER BY RANDOM() LIMIT 1')
    // // const statement = 'SELECT prompt FROM prompts WHERE category = "current" ORDER BY RANDOM() LIMIT 1'
    
    // if (logStatement)
    //     console.log('executing sql:\t\t', statement)

    // db.get(statement, (err, row) => {
    //     if (err) console.error(err)
    //     callback(row.prompt)
    // })

    let row = statement.get()
    console.log(row)
    callback(row.prompt)
}

exports.selectNewActivePrompt = (callback, logStatement = false) => {
    getActivePrompt((prompt) => {
        changePromptCategory(prompt, 'past', logStatement)

        getRandomPromptFromCurrentPool((newActivePrompt) => {
            changePromptCategory(newActivePrompt, 'active', logStatement)
            callback(newActivePrompt)
            console.log('new active prompt selected:', newActivePrompt)
        }, logStatement)
    }, logStatement)
}


exports.approvePrompts = (prompts, logStatement = false) => {
    prompts.map((prompt) => {
        changePromptCategory(prompt, 'current', logStatement)
    })
}

exports.rejectPrompts = (prompts, logStatement = false) => {
    prompts.map((prompt) => {
        removePrompt(prompt, logStatement)
    })
}
