/**
 * Created by 侯小贤 on 2016/11/6.
 */
//    数据更新不影响，我只要查找的时候，通过外键去另一个表查找就好了
//    删除，要一并删除
var  mongodb=require("mongoose");
var  db=require("./db.js");

var  USERPAGESIZE=8;

//创建schema
var userSchema=new mongodb.Schema({
    username:{type:String},//用户名字
    password:{type:String},//用户密码
    avatar:{type:String},//头像
    role:{type:String},//角色身份
    registDate:{type:Date}//注册时间
})

//创建静态方法-----------------------------------------------

//创建用户
userSchema.statics.insertUser= function (json,callback) {
    this.model("user").create(json, function (err,result) {
        if(err){
            console.log(err);
            return
        }
        //result是一个对象
        callback(result)
    })
}

//查找某个用户
userSchema.statics.findOneUser= function (json,callback) {
    this.model("user").findOne(json).sort({registDate:-1}).exec(function (err,result) {
        if(err){
            console.log("查找错误")
            return
        }
        //result是一个数组
        callback(result)
    })
}

//根据分页查找所有用户
userSchema.statics.findAllUser= function (page,callback) {
    var skip=(page-1)*USERPAGESIZE;
    var that=this
    this.model("user").find({}).limit(USERPAGESIZE).skip(skip).sort({registDate:-1}).exec(function (err,result) {
        if(err){
            console.log("查找错误")
            return
        }
        //查用户总数
        that.model("user").find({}).count().exec(function (err,result2) {

            callback(result,result2)
        })
    })
}

//删除用户
userSchema.statics.delUser= function (json,callback) {
    this.model("user").remove(json, function (err,result) {
        if(err){
            console.log(err)
            return
        }
        callback(result)
    })
}

//更新用户
userSchema.statics.updateUser= function (json,condition,callback) {
    this.model("user").update(json,condition, function (err,result) {
        if(err){
            console.log(err)
            return
        }
      callback(result)
    })
}

//创建模型
var userModel=db.model("user",userSchema);

//暴露模型
module.exports=userModel



