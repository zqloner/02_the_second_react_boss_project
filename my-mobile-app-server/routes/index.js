var express = require('express');
var router = express.Router();

const md5 = require('blueimp-md5');
const {UserModel,ChatModel} = require('../db/models');

const filter = {password:0,_v:0}  //查询时指定要过滤的属性

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'});
});

//注册一个路由:用户注册
//a) path 为: /register
// b) 请求方式为: POST
// c) 接收 username 和 password 参数
// d) admin 是已注册用户
// e) 注册成功返回: {code: 0, data: {_id: 'abc', username: ‘xxx’, password:’123’}
// f) 注册失败返回: {code: 1, msg: '此用户已存在'}
// router.post('/register', function (req, res) {
//   console.log("register====>");
// //1)获取请求参数
//   const {username, password} = req.query;
// //2)处理
// //3)返回响应数据
//   if (username === 'admin') {
//     //注册失败
//     res.send({code: 1, msg: '此用户已存在'})
//   } else {
//     //注册成功
//     res.send({code: 0, data:{_id:'abc123',username,password}})
//   }
//
// });

//注册的路由
router.post('/register',function (req,res) {
//  1,读取请求参数
  const {username, password,type} = req.body;
//  2，处理
    //判断用户是否存在,如果存在,提示错误信息
  UserModel.findOne({username:username},function (error,doc) {

//  3,返回响应数据
    if (doc) {
      //存在
      res.send({code:1,msg:'用户已存在'});
    } else {
      //不存在,就保存
      new UserModel({username,type, password:md5(password)}).save(function (error,user) {
        //返回包含user的json数据
        const data = {_id:user._id,username,type};
        res.cookie('userid', user._id, {maxAge: 1000 * 60 * 60 * 24});
        res.send({code:0,data:data});
      })
    }
  })

});

//登录的路由
router.post('/login',function (req,res) {
  console.log('aaa')
  const {username,password} = req.body;
  //根据username和password查询数据库users集合，如果没有,返回提示错误的信息,如果有，返回登录成功信息(包含user)。
  UserModel.findOne({username,password:md5(password)},filter,function (error,user) {
    if (user) {
      //登录成功
      //生成cookie（userid:user._id),并交给浏览器保存
      res.cookie('userid',user.id,{maxAge: 1000 * 60 * 60 * 24});
      //返回登录成功的信息(包含user)
      res.send({code:0,data:user})
    } else {
      //登录失败
      res.send({code:1,msg:'用户名或密码不正确'});
    }
  })
});

//跟新用户信息的路由
router.post('/update',function (req,res) {
  //从请求的cookie中得到userid
  const userid= req.cookies.userid;
  if (!userid) {
    //如果没有,说明没有登录,直接返回提示
    return  res.send({code:1, msg: '请登录'});
  }
  //存在。根据userid更新对应的user文档数据

  //得到提交的用户数据
  const user = req.body;
  UserModel.findByIdAndUpdate({_id:userid},user,function (error,oldUser) {
    if (!oldUser) { //旧数据不存在
      //通知浏览器删除cookie
      res.clearCookie('userid');
      //返回一个提示信息
      res.send({code: 1, msg: '请登录'});
    } else {
      //准备一个返回的user数据对象
      const {_id, username, type} = oldUser;
      const data = Object.assign(user, {_id, username, type});
      //返回
      res.send({code: 0, data});
    }
  })
});

//根据cookoe中userid获取用户信息
router.get('/user',function (req,res) {
  //从请求的cookie中得到userid
  const userid= req.cookies.userid;
  if (!userid) {
    //如果没有,说明没有登录,直接返回提示
    return  res.send({code:1, msg: '请登录'});
  }
  //根据userid查询对应的user
  UserModel.findOne({_id:userid},filter,function (error,user) {
    res.send({code:0,data:user})
  });
});

//获取用户列表（根据用户类型）
router.get('/userlist',function (req,res) {
  const {type} = req.query;
  UserModel.find({type},filter,function (error,users) {
    res.send({code:0, data: users});
  })
});


/*
获取当前用户所有相关聊天信息列表
*/
router.get('/msglist', function (req, res) {
// 获取cookie 中的userid
  const userid = req.cookies.userid;
// 查询得到所有user 文档数组
  UserModel.find(function (err, userDocs) {
// 用对象存储所有user 信息: key 为user 的_id, val 为name 和header 组成的user 对象
    const users = {}; // 对象容器
    userDocs.forEach(doc => {
      users[doc._id] = {username: doc.username, header: doc.header}
    });
    /*
    查询userid 相关的所有聊天信息
    参数1: 查询条件
    参数2: 过滤条件
    参数3: 回调函数
    */
    ChatModel.find({'$or': [{from: userid}, {to: userid}]}, filter, function (err,chatMsgs) {
// 返回包含所有用户和当前用户相关的所有聊天消息的数据
      res.send({code: 0, data: {users, chatMsgs}})
    })
  })
});
/*
修改指定消息为已读
*/
router.post('/readmsg', function (req, res) {
// 得到请求中的from 和to
  const from = req.body.from;
  const to = req.cookies.userid;
  /*
更新数据库中的chat 数据
参数1: 查询条件
参数2: 更新为指定的数据对象
参数3: 是否1 次更新多条, 默认只更新一条
参数4: 更新完成的回调函数
*/
  ChatModel.update({from, to, read: false}, {read: true}, {multi: true}, function (err,doc) {
    console.log('/readmsg', doc);
    res.send({code: 0, data: doc.nModified}) // 更新的数量
  })
});
module.exports = router;
