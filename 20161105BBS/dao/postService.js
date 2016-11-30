
var  mongodb=require("mongoose");
var  db=require("./db.js");

var  PAGESIZE=5;
//创建schema
var postSchema=new mongodb.Schema({
    authorId:{type:String},//关联的用户的id
    postTitle:{type:String},//帖子标题
    postContent:{type:String},//帖子内容
    postDate:{type:Date},//发表日期,
    hasnewComment:{type:Number,default:0}//是否有新评论
})

//创建静态方法-----------------------------------------------

//发帖子，找到用户的id
postSchema.statics.setPost= function (json,callback) {
    this.model("post").create(json, function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//查找具体的帖子
postSchema.statics.getDetailPost= function (json,callback) {
    this.model("post").findOne(json).exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//根据页数返回帖子
postSchema.statics.getPagePost= function (json,page,callback) {

    var skipCount=(page-1)*PAGESIZE;
    this.model("post").find(json).limit(PAGESIZE).skip(skipCount).sort({postDate:-1}).exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//查找帖子总页数
postSchema.statics.getPostCount= function (json,callback) {
    this.model("post").find(json).count().exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        var page=Math.ceil(result/PAGESIZE)
        callback(page,result)
    })
}

//查找帖子(包括首页所有，获取用户的所有）
postSchema.statics.getAllPost= function (json,callback) {
    this.model("post").find(json).sort({postDate:-1}).exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//更新帖子，本来是用来更新评论的，但是后面想想多余了
postSchema.statics.updatePost= function (json,condition, callback) {
    this.model("post").update(json,condition,function(err,result){
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//删除帖子,相应也要删除评论
postSchema.statics.delPost= function (json,callback) {
    this.model("post").remove(json,function(err,result){
        if(err){
            console.log(err)
            return
        }
        callback(result)
    })
}

//创建模型
var  postModel=db.model("post",postSchema)


//暴露模型
module.exports=postModel