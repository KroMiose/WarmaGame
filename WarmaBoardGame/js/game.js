/* 变量声明 */

// 游戏版本
var version = '2.1';

// 记录当前基本信息
var nowFoods = 5;
var nowDice = 1;
var nowRound = 1;
var defMaxFoods = 99;
var maxFoods = defMaxFoods;

// 记录本回合食物变化数
var addFood = 0;
var intakeSum = 0;
var getFoodSum = 0;

// 记录本回合怪物食用食物总量
var damageSum = 0;

// 资源获得比率
var sourceRate = 1;

// 怪物冻结
var freeze = false;

// 当前怪物列表 一回合内最近生成怪物索引值
var curMonsters = [];
var curSpawn = 0;

// 本回合即将发生的事件
var curEvent;
var addEvent = [];

// 输出日志列表
var logs = [];

// 本次骰子点数
var diceNum;

// 困难难度是否开启
var hardMod = false;
var hardModRound = parseInt(Math.random()*50) + 75;

// 面板开关
var logPad = true;
var bagPad = false;
var craftPad = false;
var topPad = false;

// 信息栏展开
var infoExp = false;

// 玩家信息
var userID = '一位不知名的沃沃头';

// 后端服务器地址
// var server = "localhost:2233";
var server = "http://warma.starail.fun:2233";

// 当前排行榜
var nowTop = null;

$(() => {
    $('title').text('Warma的养鸡场大冒险 v '+ version +' !!!');
    clg("沃玛的养鸡场大冒险已就绪，当前版本为 " + version);
    clg("游戏设计灵感来源于沃玛的奇思妙想，点击右下角 帮助按钮 可查看规则说明");
    refreshTab();
    reqTop();
})

// id登录
function login(){
    userID = $("#inputId").val();
    $(".login").hide();
    reqTop();
}

// 投掷骰子触发函数
function roll() {
    diceNum = Math.floor(Math.random() * 6 + 1)

    if (nowDice == 0) {
        nowDice++;
        restart();
        refreshTab();
        return;
    }

    if (nowDice < 5 && nowDice > 0) {
        $("#dice-" + nowDice).text(diceNum);

        if (nowDice == 1) {
            getMonster(monsters[diceNum]);
        } else if (nowDice == 2) {
            getEvent(events[diceNum]);
        } else if (nowDice == 3) {
            getFood(foods[diceNum]);
        } else if (nowDice == 4) {
            getSource(diceNum);
        }
        nowDice++;
    } else {
        runRound();
    }
    refreshTab();
}

// 进行回合
function runRound() {
    // 检测是否进入困难模式
    if (nowRound == hardModRound) {
        clg("忆雨老师拿起了笔");
        $(".round").css("color","red");
        hardMod = true;
    }

    // 重置骰子点数
    $(".diceNum").text("?");

    // 执行当前回合事件和附加事件
    curEvent();
    addEvent.forEach((e, idx) => {
        e.run();
    })

    // 执行伤害结算
    if (damageSum > 0) {
        curMonsters.forEach((item, idx) => {
            if ((!isNaN(item.hp)) && damageSum > 0) {
                let mhp = item.hp;
                item.hp -= damageSum;
                damageSum -= mhp;
            }
        })
    }

    // 执行怪物动作
    curMonsters.forEach((item, idx) => {
        if (item.run) {
            item.run(idx);
        }
    })

    // 食物结算并重置
    getFoodSum = 0;
    nowFoods -= intakeSum;
    nowDice = 1;
    nowFoods += addFood;
    addFood = 0;
    damageSum = 0;
    addEvent = [];

    // 恢复冻结
    if(freeze){
        freeze = !freeze;
        clg('怪物们已经恢复活动了')
    }

    // 限制最大食物持有量
    if(nowFoods > maxFoods){
        clg("你的食物储存过多，农场放不下了！");
        nowFoods = maxFoods;
    }

    // 判断游戏结束
    if (nowFoods < 0) {
        clg("你的食物被吃完啦，好朋友们都离你而去了！");
        nowDice = 0;
        postTop();
        refreshTab();
        return;
    }

    // 回合计数器 +1 刷新页面
    nowRound++;
    refreshTab();
}

// 获取怪物
function getMonster(monster) {
    var mst = $.extend(true, {}, monster);
    curSpawn = curMonsters.push(mst) - 1;
    clg("一道雷光闪过， " + monster.name + " 降落在了你的农场");
}

// 获取回合事件
function getEvent(event) {
    curEvent = event.run;
    clg("第二颗骰子停在了 " + diceNum + " 似乎发生了什么变化");
}

// 获取食物
function getFood(food) {
    getFoodSum = food.foodNum;
    if (food.damage > 0) {
        clg("你获得了一位好朋友 当前食物 +" + food.foodNum + " 当前攻击力 +" + food.damage)
        addFood += food.foodNum;
        damageSum += food.damage;
    } else {
        clg("你获得了 " + food.name + " 当前食物 +" + food.foodNum);
        addFood += food.foodNum;
    }
}

// 获取资源
function getSource(idx) {
    clg("你获得了 " + sources[idx].name + " x " + sourceRate);
    sources[idx].quantity += sourceRate;
    sourceRate = 1;
}

// 杀死怪物
function killMst(idx) {
    if (curMonsters[idx].death)
        curMonsters[idx].death();

    curMonsters.splice(idx, 1);
}

// 刷新页面
function refreshTab() {
    let sourcesList = "";
    curMonsters.forEach((item, idx) => {
        if (item.hp <= 0) {
            clg(item.name + " 因为体力过低死掉了");
            killMst(idx);
        }
    })
    sources.forEach((item, idx) => {
        if (idx > 0 && item.quantity > 0)
            sourcesList += `
                <li onclick="useItem(${idx})">
                    ${item.name}
                    <img src="">
                    <span>${item.quantity}</span>
                </li>
            `
    })
    $("#bagList").html(sourcesList);

    let monstersList = "";
    intakeSum = 0;
    curMonsters.forEach((item, idx) => {
        intakeSum += item.intake;
        monstersList += `
            <tr>
                <th scope="row">${item.name}</th>
                <td>${item.hp}</td>
                <td>${item.intake}</td>
            </tr>
        `
    })
    if(freeze) intakeSum = 0;
    $("#monstersTab").html(monstersList);

    let logsList = "";
    logs.forEach((item, idx) => {
        logsList += `
            <tr>
                <th scope="row">[${item.time}] ${item.e}</th>
            </tr>
        `
    })
    $("#logsTab").html(logsList);

    $("#dmgCnt").text(damageSum);
    $("#foodCnt").text(nowFoods + "(" + (addFood - intakeSum > 0 ? '+' + (addFood - intakeSum) :
        (addFood - intakeSum)) + ")");
    $("#roundCnt").text(nowRound);
}

// 获取时间并按格式返回
function getTime() {
    let curTime = new Date();
    let result = curTime.getHours() + ":" +
        (curTime.getMinutes() < 10 ? '0' + curTime.getMinutes() : curTime.getMinutes()) + ":" +
        (curTime.getSeconds() < 10 ? '0' + curTime.getSeconds() : curTime.getSeconds());
    return result;
}

// 记录日志
function clg(info) {
    let curTime = getTime() + ''
    logs.unshift({
        time: curTime,
        e: info
    })
}

// 使用物品
function useItem(idx) {
    if (sources[idx].use) {
        sources[idx].use();
    }
    damageSum += sources[idx].damage;
    sources[idx].quantity--;
    refreshTab();
}

// 制作物品
function craft(name){
    let outputItem = findItem(name);
    
    if(checkCraft(name)){
        clg("你制作出了 " + name + " x " + outputItem.output);
        outputItem.need.forEach((item, idx)=>{
            findItem(item.name).quantity -= item.val;
        })
        outputItem.quantity += outputItem.output;
    }
    else
        clg("你尝试着把几种材料组合起来，但是什么都没有发生");
    refreshTab();
}

// 检测合成条件
function checkCraft(name){
    let outputItem = findItem(name);
    let flag = true;
    outputItem.need.forEach((item, idx)=>{
        if(findItem(item.name).quantity < item.val)
            flag = false;
    })
    return flag;
}

// 寻找物品
function findItem(name){
    let idx = sources.findIndex((item)=>{
        return item.name == name;
    })
    return sources[idx];
}

// 切换合成面板
function togCraft(){
    if(craftPad == true){
        $(".craft").css("left","-300px");
        craftPad = !craftPad;
    }else{
        $(".craft").css("left","-30px");
        craftPad = !craftPad;
    }
}

// 切换背包
function togBag(){
    if(bagPad == true){
        $(".bag").css("right","-300px");
        bagPad = !bagPad;
    }else{
        $(".bag").css("right","0");
        bagPad = !bagPad;
    }
}

// 切换排行榜
function togTop(){
    if(topPad == true){
        $(".topList").hide();
        topPad = !topPad;
    }else{
        $(".topList").show();
        topPad = !topPad;
    }
}

// 重启游戏
function restart() {
    curMonsters = [];
    logs = [];
    sources.forEach((item, idx) => {
        item.quantity = 0;
    })
    nowFoods = 5;
    addFood = 0;
    nowRound = 1;
    curEvent = undefined;
    sourceRate = 1;
    maxFoods = defMaxFoods;
    $(".round").css("color","white");

    clg("沃玛桌游已就绪，当前版本为 " + version);
    clg("游戏设计灵感来源于沃玛的奇思妙想，点击右上角 帮助按钮 可查看规则说明");
}

// 隐藏说明
function hidInt() {
    $(".intro").css("top", "-100%");
    $(".intro button").hide();
}

// 显示说明
function showInt() {
    $(".intro").css("top", "0");
    $(".intro button").show();
}

// 切换信息显示开关
function togLog(){
    if(logPad == true){
        $(".log").hide();
        logPad = !logPad;
    }else{
        $(".log").show();
        logPad = !logPad;
    }
}

function expend(){
    if(infoExp)
        $('.head').css('top', '10px')
    else
        $('.head').css('top', '25px')
    infoExp = !infoExp
}

// 发起排行榜数据请求
function reqTop(){
    $.ajax({
        type: "get",
        url: server+'/getTop',
        dataType: "jsonp",
        success: function (data) {
            let topList = ''
            let i = 1
            nowTop = data.top.filter((item)=>{
                return item.v == version
            });
            nowTop = nowTop.sort( (a, b)=> b.score - a.score )
            nowTop.forEach((item, idx)=>{
                topList += `
                <li class="${(item.id == userID? 'hl':'')}">
                    <div class="num">${i++}</div>
                    <div class="id">${item.id}</div>
                    <div class="score">${item.score}</div>
                </li>
                `
            })
            $("#topList").html(`
            <li class="tit">
                <div class="num">名次</div>
                <div class="id">玩家名</div>
                <div class="score">回合数</div>
            </li>` + topList)
            console.log(nowTop);
        },
        error:function(xhr){
            alert('服务器错误，请稍后再试');
            console.log(xhr.status);
        }
    })
}

// 发起排行榜写入请求
function postTop(){
    let data = {
        id: userID,
        v: version,
        score: nowRound
    }
    $.ajax({
        type: "get",
        url: `${server}/upload?id=${data.id}&score=${data.score}&v=${data.v}`,
        dataType: "jsonp",
        success: function (data) {
            console.log(data);
        },
        error:function(xhr){
            if(xhr.status != 200)
                alert('服务器错误，请稍后重试');
            reqTop();
        }
    })
}


// 怪物基本信息库
var monsters = [{},
    {
        name: "史莱姆",
        hp: 2,
        intake: 1,
        death: () => {
            clg("史莱姆 进行了分裂产生了 小型史莱姆 x 3")
            for (let i = 0; i < 3; i++) {
                curMonsters.push({
                    name: "小型史莱姆",
                    hp: 1,
                    intake: 1,
                    death: () => {
                        findItem('粘液球').quantity += 1;
                        clg('你获得了 粘液球 x 1');
                    }
                })
            }
        }
    }, {
        name: "哥布林",
        hp: 4,
        intake: 2,
        death:()=>{
            if (Math.floor(Math.random() * 6 + 1) < 4){
                findItem('哥布林长矛').quantity += 1;
                clg('哥布林 掉落了 哥布林长矛 x 1')
            }
        }
    }, {
        name: "海草怪",
        hp: 3,
        intake: 1,
        death: () => {
            addFood += 2;
            clg('你获得了 海草 ，食物增加了 2')
        }
    }, {
        name: "火焰怪",
        hp: '???',
        intake: 1,
        death: () => {
            if (Math.floor(Math.random() * 6 + 1) < 5){
                findItem('烈焰粉').quantity += 1;
                clg('火焰怪 掉落了 烈焰粉 x 1')
            }
        }
    }, {
        name: "毒蛇",
        hp: 5,
        intake: 2
    }, {
        name: "天使",
        hp: '???',
        intake: 3,
        run: () => {
            if (curMonsters.length > 0) {
                let minIdx = 0;
                let maxHp = 9999;
                curMonsters.forEach((item, idx) => {
                    if (!isNaN(item.hp) && maxHp > item.hp) {
                        maxHp = item.hp;
                        minIdx = idx;
                    }

                })
                if (!isNaN(curMonsters[minIdx].hp) || Math.floor(Math.random() * 6 + 1) < 3) {
                    clg(curMonsters[minIdx].name + " 被天使之力杀死了");
                    killMst(minIdx);
                }
            }
        },
        death: () => {
            if (Math.floor(Math.random() * 6 + 1) < 2){
                findItem('天使之环').quantity += 1;
                clg('天使 掉落了 天使之环')
            }
            if (Math.floor(Math.random() * 6 + 1) < 2){
                findItem('沃玛的零食罐').quantity += 1;
                clg('天使 掉落了 沃玛的零食罐')
            }
            if (Math.floor(Math.random() * 6 + 1) < 3 || hardMod == true) {
                clg("天使 堕落成了 堕落天使");
                curMonsters.push({
                    name: "堕落天使",
                    hp: 10,
                    intake: 0,
                    run: () => {
                        var mst = $.extend(true, {}, monsters[Math.floor(Math.random() * 6 + 1)]);
                        curSpawn = curMonsters.push(mst) - 1;
                        clg("堕落天使 召唤了 " + mst.name);
                    }
                })
            }
        }
    }
];

// 事件库
var events = [{},
    {
        name: "我方食物 x 1.5",
        run: () => {
            nowFoods = Math.floor(nowFoods * 1.5);
            clg("获得来自好朋友的祝福 我方食物 x 1.5");
        }
    }, {
        name: "杀死敌方怪物中最低生命值的一只（需有生命值）",
        run: () => {
            if (curMonsters.length > 0) {
                let minIdx = 0;
                let maxHp = 9999;
                curMonsters.forEach((item, idx) => {
                    if (!isNaN(item.hp) && maxHp > item.hp) {
                        maxHp = item.hp;
                        minIdx = idx;
                    }

                })
                if (!isNaN(curMonsters[minIdx].hp)) {
                    clg("一股神秘的力量抹杀了 " + curMonsters[minIdx].name);
                    killMst(minIdx);
                }
            }
        }
    }, {
        name: "敌方全体怪物血量减半",
        run: () => {
            curMonsters.forEach((item, idx) => {
                if (item.hp != '???')
                    item.hp -= item.hp / 2;
            })
            clg("获得来自蜘蛛的祝福 敌方全体怪物血量减半");
        }
    }, {
        name: "敌方怪物血量 x 1.5",
        run: () => {
            curMonsters.forEach((item, idx) => {
                if (item.hp != '???')
                    item.hp += item.hp / 2;
            })
            clg("忆雨力量觉醒 敌方全体怪物血量加半");
        }
    }, {
        name: "当前回合获得物品 x 一定倍率",
        run: () => {
            sourceRate *= 2;
            clg("获得来自沃玛的祝福 下一回合获得物品 x " + sourceRate);
        }
    }, {
        name: "回合结束后清除当前回合生成怪物",
        run: () => {
            if (curMonsters[curSpawn]) {
                clg(curMonsters[curSpawn].name + " 因受到诅咒而死亡")
                killMst(curSpawn);
            } else {
                clg("诅咒似乎没有效果");
            }
        }
    }
]

// 食物库
var foods = [{},
    {
        name: "玉米",
        foodNum: 2,
        damage: 0
    }, {
        name: "水稻",
        foodNum: 1,
        damage: 0
    }, {
        name: "鸡",
        foodNum: 5,
        damage: 2
    }, {
        name: "鱼",
        foodNum: 2,
        damage: 0
    }, {
        name: "土豆",
        foodNum: 2,
        damage: 0
    }, {
        name: "青菜",
        foodNum: 3,
        damage: 0
    }
];

// 资源库
var sources = [{},
    {
        name: "木棒",
        damage: 0,
        quantity: 0,
        use: () => {
            clg("你拿起了 木棒，但是怪物似乎无动于衷");
        }
    }, {
        name: "柴火",
        damage: 0,
        quantity: 0,
        use: () => {
            if (getFoodSum == 0) {
                clg("你使用了 柴火 x 1，你感觉可温暖了");
                return;
            }
            addFood += getFoodSum;
            clg("你使用了 柴火 x 1 用于烹饪食物，获得了 食物 x " + getFoodSum);
            getFoodSum = 0;
            refreshTab();
        }
    }, {
        name: "石头",
        damage: 1,
        quantity: 0,
        use: () => {
            clg("你投掷了一颗 石头 ，回合攻击力增加了 1");
        }
    }, {
        name: "刀",
        damage: 3,
        quantity: 0,
        use: () => {
            clg("你抽出了 刀 ，回合攻击力增加了 3");
        }
    }, {
        name: "灭火器",
        damage: 0,
        quantity: 0,
        use: () => {
            let randNum = Math.floor(Math.random() * 6 + 1)
            if (randNum < 4) {
                clg("你吹响了 灭火器 ，似乎没有产生什么作用");
                return;
            } else {
                clg("你吹响了 灭火器 ，似乎产生了什么变化");
                randNum = Math.floor(Math.random() * 6 + 1);
                addEvent.push(events[randNum]);
            }

        }
    }, {
        name: "水",
        damage: 0,
        quantity: 0,
        use: () => {
            let removed = false;
            curMonsters.forEach((item, idx) => {
                if (item.name == "火焰怪" && removed == false) {
                    killMst(idx);
                    removed = true;
                    clg("一只 火焰怪 被浇灭了");
                }
            })
        }
    },{
        name: "雪人权杖",
        damage: 0,
        quantity: 0,
        need: [
            {name:'木棒', val:2},
            {name:'水', val:1},
        ],
        output: 1,
        use: () => {
            clg("你使用了 雪人权杖，雪人 出现在了你的农场")
            curMonsters.push({
                name: "雪人",
                hp: '???',
                intake: 0
            })
        }
    },{
        name: "人工引信",
        damage: 0,
        quantity: 0,
        need: [
            {name:'柴火', val:1},
            {name:'灭火器', val:1},
            {name:'烈焰粉', val:1}
        ],
        output: 1,
        use: () => {
            clg("你点燃了人工引信，核弹降落在了你的农场");
            curMonsters = [];
            nowFoods = parseInt(nowFoods / 4);
        }
    },{
        name: "石剑",
        damage: 4,
        quantity: 0,
        need: [
            {name:'木棒', val:1},
            {name:'石头', val:2},
        ],
        output: 1,
        use: () => {
            clg("你抽出了 石剑 ，回合攻击力增加了 4");
        }
    },{
        name: "天使之环",
        damage: 3,
        quantity: 0,
        use: () => {
            clg("你吃掉了 天使之环 ，获得食物 5 ，回合攻击力增加了 3")
            addFood += 5;
        }
    },{
        name: "粘液球",
        damage: 0,
        quantity: 0,
        use: () => {
            clg('你使用了 粘液球 ， 似乎什么都没有发生')
        }
    },{
        name: "哥布林长矛",
        damage: 3,
        quantity: 0,
        use: () => {
            clg('你使用了 哥布林长矛 ， 回合攻击力增加了 3');
        }
    },{
        name: "炽天使法杖",
        damage: 0,
        quantity: 0,
        need: [
            {name:'木棒', val:2},
            {name:'天使之环', val:1},
            {name:'烈焰粉', val:1},
        ],
        output: 1,
        use: () => {
            let translated = false;
            curMonsters.forEach((item, idx) => {
                if (item.name == "火焰怪" && translated == false) {
                    curMonsters[idx] = {
                        name: "炽天使",
                        hp: '???',
                        intake: 1,
                        run: () => {
                            if (Math.floor(Math.random() * 6 + 1) < 4){
                                findItem('柴火').quantity += 1;
                                clg('炽天使 制造了 柴火 x 1')
                            }
                        },
                        death: () => {
                            if (Math.floor(Math.random() * 6 + 1) < 2){
                                findItem('天使之环').quantity += 1;
                                clg('炽天使 掉落了 天使之环')
                            }
                        }
                    }
                    translated = true;
                    if(translated){
                        clg('你使用了 炽天使法杖，一只 火焰怪 变成了 炽天使')
                    }else{
                        clg('你使用了 炽天使法杖，但是似乎什么都没有发生')
                    }
                }
            })
        }
    },{
        name: "烈焰粉",
        damage: 0,
        quantity: 0,
        use: () => {
            clg('你把 烈焰粉 撒在了地上，似乎什么都没有发生')
        }
    },{
        name: "沃玛的零食罐",
        damage: 0,
        quantity: 0,
        use: () => {
            maxFoods += 10
            clg('你使用了 沃玛的零食罐， 农场食物存储上限增加了 10')
        }
    },{
        name: "史莱姆炸弹",
        damage: 0,
        quantity: 0,
        need: [
            {name:'粘液球', val:9}
        ],
        output: 1,
        use: () => {
            clg('你使用了 史莱姆炸弹，怪物都无法动弹了')
            freeze = true;
        }
    }
]

/*
程序思路

回合开始
1.掷第一颗骰子生成随机数字
2.生成怪物

3.掷第二颗骰子生成随机数字
4.获得本回合即将发生的事件

5.掷第三颗骰子生成随机数字
6.生成食物，累加到本回合食物变化量

7.掷第四颗骰子生成随机数字
8.从资源库获得材料
（点击进行回合前任意阶段均可使用道具并且会直接触发对应效果）

点击 进行回合 后
9.事件生效（先骰子事件后灭火器事件）
10.对怪物进行逐一检查并执行怪物事件（如天使击杀效果等）
11.对怪物进行逐一检查，将本回合累计伤害分配给每个怪物直到分配完，同时检查怪物是否死亡并删除
12.判断游戏是否结束（食物是否小于0）
进入下一回合
*/