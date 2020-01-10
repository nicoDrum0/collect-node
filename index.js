const mysql = require('mysql')
const http = require('http')
const qs = require('querystring')

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'djxc24zwy',
    database: 'test'
})

connection.connect()

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    if (req.method === 'POST') {
        let pathname = req.url
        let postData = ''
        req.addListener('data', chunk => {
            postData += chunk
        })
        req.addListener('end', () => {
            let result = qs.parse(postData)
            if (pathname === '/login') {
                // 登录
                const username = result.username
                const password = result.password
                let readSql =
                    "SELECT * FROM user WHERE username  = '" + username + "'"
                connection.query(readSql, (error, response) => {
                    if (error) {
                        throw error
                    } else {
                        if (response === undefined || response.length === 0) {
                            res.write(
                                JSON.stringify({
                                    code: 1,
                                    message: '用户不存在！'
                                })
                            )
                            res.end()
                        } else {
                            let newRes = JSON.parse(JSON.stringify(response))
                            const _folder = JSON.parse(newRes[0].folder)
                            if (newRes[0].password === password) {
                                res.write(
                                    JSON.stringify({
                                        code: 0,
                                        message: '登录成功！',
                                        data: {
                                            id: newRes[0].id,
                                            username: newRes[0].username,
                                            folder: _folder
                                        }
                                    })
                                )
                                res.end()
                            } else {
                                res.write(
                                    JSON.stringify({
                                        code: 1,
                                        message: '密码错误！'
                                    })
                                )
                                res.end()
                            }
                        }
                    }
                })
            } else if (pathname === '/register') {
                // 注册
                new Promise((resolve, reject) => {
                    let readSql = 'SELECT * FROM user'
                    connection.query(readSql, (error, response) => {
                        if (error) {
                            throw error
                        } else {
                            let newRes = JSON.parse(JSON.stringify(response))
                            let usernameRepeat = false
                            for (let item in newRes) {
                                if (newRes[item].username === result.username) {
                                    usernameRepeat = true
                                }
                            }

                            if (usernameRepeat) {
                                res.write(
                                    JSON.stringify({
                                        code: 1,
                                        message: '用户已存在！'
                                    })
                                )
                                res.end()
                            } else {
                                resolve()
                            }
                        }
                    })
                }).then(() => {
                    const username = result.username
                    const password = result.password
                    connection.query(
                        `INSERT INTO user(username, password) VALUES(${username}, ${password})`,
                        (err, result) => {
                            if (err) {
                                throw err
                            } else {
                                res.write(
                                    JSON.stringify({
                                        code: 0,
                                        message: '注册成功！'
                                    })
                                )
                                res.end()
                            }
                        }
                    )
                })
            } else if (pathname === '/postSite') {
                // 添加文件夹
                const folderName = result.foldername
                new Promise((resolve, reject) => {
                    let readSql =
                        "SELECT * FROM user WHERE id  = '" + result.id + "'"
                    connection.query(readSql, (error, response) => {
                        if (error) {
                            throw error
                        } else {
                            let folder = JSON.parse(response[0].folder)
                            const _folder = Object.assign([], folder)
                            let newKeyIndex
                            if (_folder.length === 0) {
                                newKeyIndex = 0
                            } else {
                                const lastKeyArr = folder[
                                    folder.length - 1
                                ].key.split('-')
                                newKeyIndex = parseInt(lastKeyArr.pop()) + 1
                            }
                            let nameArr = []
                            for (const item of _folder) {
                                nameArr.push(item.title)
                            }
                            if (nameArr.indexOf(folderName) < 0) {
                                _folder.push({
                                    key: `0-${newKeyIndex}`,
                                    title: folderName,
                                    children: []
                                })
                                let sql = `UPDATE user SET folder = ? WHERE id = ${result.id}`
                                connection.query(
                                    sql,
                                    resFolder,
                                    (error, results, fields) => {
                                        if (error) {
                                            console.log(error)
                                        } else {
                                            res.write(
                                                JSON.stringify({
                                                    code: 0,
                                                    message: '添加成功！',
                                                    folder: _folder
                                                })
                                            )
                                            res.end()
                                        }
                                    }
                                )
                            } else {
                                res.write(
                                    JSON.stringify({
                                        code: 1,
                                        message: '该文件夹已存在，请重新命名！'
                                    })
                                )
                                res.end()
                            }
                        }
                    })
                })
            } else if (pathname === '/delFolder') {
                console.log(result)
                const eventKey = result.eventKey
                let readSql =
                    "SELECT * FROM user WHERE id  = '" + result.id + "'"
                connection.query(readSql, (error, response) => {
                    if (error) {
                        throw error
                    } else {
                        const folder = JSON.parse(response[0].folder)
                        const _folder = Object.assign([], folder)
                        const resArr = _folder.filter((value, index, array) => {
                            return value.key !== eventKey
                        })
                        const _resArr = JSON.stringify(resArr)
                        let sql = `UPDATE user SET folder = ? WHERE id = ${result.id}`
                        connection.query(
                            sql,
                            _resArr,
                            (error, results, fields) => {
                                if (error) {
                                    throw error
                                } else {
                                    res.write(
                                        JSON.stringify({
                                            code: 0,
                                            message: '删除成功！',
                                            folder: resArr
                                        })
                                    )
                                    res.end()
                                }
                            }
                        )
                    }
                })
            } else if (pathname === '/rename') {
                console.log(result)
                const eventKey = result.eventKey
                const newName = result.newName
                let readSql =
                    "SELECT * FROM user WHERE id  = '" + result.id + "'"
                connection.query(readSql, (error, response) => {
                    if (error) {
                        throw error
                    } else {
                        const folder = JSON.parse(response[0].folder)
                        const _folder = Object.assign([], folder)
                        _folder.map(item => {
                            if (item.key === eventKey) {
                                item.title = newName
                            }
                        })
                        const _resArr = JSON.stringify(_folder)
                        let sql = `UPDATE user SET folder = ? WHERE id = ${result.id}`
                        connection.query(
                            sql,
                            _resArr,
                            (error, results, fields) => {
                                if (error) {
                                    throw error
                                } else {
                                    res.write(
                                        JSON.stringify({
                                            code: 0,
                                            message: '重命名成功！',
                                            folder: resArr
                                        })
                                    )
                                    res.end()
                                }
                            }
                        )
                    }
                })
            }
        })
    } else if (req.method === 'GET') {
        let pathname = req.url
        if (pathname === '/site') {
            let readSql = 'SELECT * FROM site'
            connection.query(readSql, (error, response) => {
                if (error) {
                    throw error
                } else {
                    let newRes = JSON.parse(JSON.stringify(response))
                    res.write(
                        JSON.stringify({
                            code: 0,
                            data: newRes
                        })
                    )
                    res.end()
                }
            })
        }
    }
})

server.listen(3001)
console.log('app started at port 3000...')
