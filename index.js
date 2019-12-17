const mysql = require('mysql')
const http = require('http')
const url = require('url')
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
                connection.query(readSql, (err1, res1) => {
                    if (err1) {
                        throw err1
                    } else {
                        if (res1 === undefined || res1.length === 0) {
                            res.write(
                                JSON.stringify({
                                    code: 1,
                                    message: '用户不存在！'
                                })
                            )
                            res.end()
                        } else {
                            let newRes = JSON.parse(JSON.stringify(res1))
                            if (newRes[0].password === password) {
                                res.write(
                                    JSON.stringify({
                                        code: 0,
                                        message: '登录成功！',
                                        data: {
                                            id: newRes[0].id,
                                            username: newRes[0].username
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
                    connection.query(readSql, (err1, res1) => {
                        if (err1) {
                            throw err1
                        } else {
                            let newRes = JSON.parse(JSON.stringify(res1))
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
                                console.log(err)
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
            }
        })
    } else if (req.method === 'GET') {
        console.log('get method')
    }
})

server.listen(3001)
console.log('app started at port 3000...')
