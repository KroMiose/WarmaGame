var http = require('http')
var fs = require('fs')
var url = require('url')

var Port = 2233 // 服务端口号
var Top // 排行榜信息存储变量


// 创建http服务
http.createServer(function (req, res) {
    var params = url.parse(req.url, true).query
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    })
    
    console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    console.log('接收到来自 ' + req.socket.remoteAddress +' 的请求\n请求URL:', req.url)
    // 获取排行信息请求
    if(req.url == '/reload'){
        loadTop()
        res.end(JSON.stringify(Top))
        return
    }
    if (req.url.slice(0, 7) == '/getTop') {
        res.end(params.callback + '(' + JSON.stringify(Top) + ')' )
        return
    }
    // 上传排行数据请求
    if (req.url.slice(0, 7) == '/upload') {
        console.log("收到上传请求，正在处理...")
        // 正则表达式匹配提取上传信息
        let m = /\/upload\?id=(.{1,})&score=(\d{1,})&v=(.{1,})&callback=.{1,}/gm.exec(req.url)

        if (m != null) {
            // 上传数据符合规范
            let id = decodeUtf8(m[1])
            let score = parseInt(m[2])
            let v = m[3]
            
            let idx = Top.top.findIndex((player)=>{
                return player.id == id && player.v == v
            })
            if(idx != -1){
                console.log('上传的用户ID已存在，索引值为：', idx, ' 开始更新数据...');
                if(v == Top.last_version){
                    Top.top[idx].id = id
                    Top.top[idx].v = v
                    Top.top[idx].score = Top.top[idx].score>score ? Top.top[idx].score:score
                }else{
                    Top.top[idx].id = id
                    Top.top[idx].v = v
                    Top.top[idx].score = score
                }
                console.log('数据更新完毕');
                res.end('已更新信息')
            }
            else{
                console.log('一位新用户上传了数据，用户名为', id);
                
                Top.top.push({
                    "id": id,
                    "score": score,
                    "v": v
                })
                console.log('用户信息已写入');
                res.end('上传成功')
            }
            save()
            return
        } else {
            // 上传数据错误
            console.log('接收到了错误的上传数据：', req.url);
            res.end('上传格式不合法')
            return
        }
    }

    res.end('Hello Warma!!')
    return
}).listen(Port)

console.log(`Server running at http://127.0.0.1:${Port}/`)
loadTop()

// 载入排行榜数据
function loadTop() {
    fs.readFile('./server.json', (error, data) => {
        if (error) {
            console.log("读取排行榜数据时失败了")
            return
        }
        Top = JSON.parse(data)
        console.log("排行榜数据读取成功！")
    })
}

// 保存排行榜数据至文件
function save() {
    fs.writeFile('./server.json', JSON.stringify(Top), (error) => {
        if (error) {
            console.log('保存文件时写入出错')
            return
        }
        console.log('文件保存成功')
    })
}

// utf-8解码
function decodeUtf8(bytes) {
    return decodeURIComponent(bytes);
}

/**
 * 请求URL:
 * 1.上传更新个人排行数据       /upload?id=xxx&score=xxx&v=xxx
 * 2.获取最新排行榜和版本信息   /getTop 
 * 3.重新载入排行数据           /reload
 */