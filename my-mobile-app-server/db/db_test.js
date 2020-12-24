/*
测试使用mongose操作数据库
 */
/*
使用 mongoose 操作 mongodb 的测试文件
1. 连接数据库
  1.1. 引入 mongoose
  1.2. 连接指定数据库(URL 只有数据库是变化的)
  1.3. 获取连接对象
  1.4. 绑定连接完成的监听(用来提示连接成功)
2. 得到对应特定集合的 Model
  2.1. 字义 Schema(描述文档结构)
  2.2. 定义 Model(与集合对应, 可以操作集合)
3. 通过 Model 或其实例对集合数据进行 CRUD 操作
  3.1. 通过 Model 实例的 save()添加数据
  3.2. 通过 Model 的 find()/findOne()查询多个或一个数据
  3.3. 通过 Model 的 findByIdAndUpdate()更新某个数据
  3.4. 通过 Model 的 remove()删除匹配的数据
 */

//引入mdf
const md5 = require('blueimp-md5')

//1,
const mongoose = require("mongoose");

mongoose.connect('mongodb://useradmin:adminpassword@127.0.0.1:27017/gzhipin_test?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//监听数据库连接
mongoose.connection.once("open",function(err){
  console.log("数据库连接成功");
});

//2,得到对应特定集合的 Model
    // 2.1. 字义 Schema(描述文档结构)
const userSchema = mongoose.Schema({
  username:{type:String,required:true},  //用户名
  password:{type:String,required:true},   //密码
  type:{type:String,required:true}        //用户类型
});

    // 2.2. 定义 Model(与集合对应, 可以操作集合)
const UserModel = mongoose.model('user', userSchema);  //集合名:users

/*3. 通过 Model 或其实例对集合数据进行 CRUD 操作*/
    // 3.1. 通过 Model 实例的 save()添加数据
function testSave() {
  //创建UserModel的实例
 const userModel =  new UserModel({username:'Bob',password: md5('234'), type: 'laoban'})
  //保存数据
  userModel.save(function (error,data) {
    console.log("save()",error,data)
  })
}
// testSave();

    // 3.2. 通过 Model 的 find()/findOne()查询多个或一个数据
function testFind() {
  //查询多个
  UserModel.find(function (error,users) {
    console.log("find()",error,users)
  });
  //查询一个
  UserModel.find({_id:"5f3ccb87f9e19729a81c598f"},function (error,user) {
    console.log('findOne()', error, user);
  })
}
// testFind();
    // 3.3. 通过 Model 的 findByIdAndUpdate()更新某个数据
function testUpdate() {
  UserModel.findByIdAndUpdate({_id:"5f3ccb87f9e19729a81c598f"},{username:'Jack'},function (error,user) {
    console.log("testUpdate()", error, user);
  })
}
// testUpdate();
    // 3.4. 通过 Model 的 remove()删除匹配的数据
function testDelete() {
  UserModel.remove({_id:"5f3ccb87f9e19729a81c598f"},function (error,doc) {
    console.log("remove", error, doc);
  })
}
testDelete();