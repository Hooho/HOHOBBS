/**
 * Created by 侯小贤 on 2016/11/8.
 */

var  mongodb=require("mongoose");
var  db=require("./db.js");


//创建静态方法-----------------------------------------------

//创建schema
var commentSchema=new mongodb.Schema({
    authorId:{type:String},//关联的用户的id
    postId:{type:String},//关联的帖子的id
    commentContent:{type:String},//评论内容
    commentDate:{type:Date},//评论日期
    commentHeaderId:{type:String},//头回复，第一个次回复
    commentLastId:{type:String},//回复的那个comment的id
    newCom:{type:Number},//判断是否是新评论
    lastAuthorId:{type:String}//保存被评论人的id
})

//给增加评论,找到用户和帖子，关联起来
commentSchema.statics.addComment= function (json,callback) {
    //关联的是用户和帖子
    this.model("comment").create(json, function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })

}

//根据所有的评论
commentSchema.statics.findComment= function (json,callback) {
    this.model("comment").find(json).sort({commentDate:-1}).exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//根据帖子id查找帖子所有的评论总数
commentSchema.statics.findAllCommentCount= function (json,callback) {
    this.model("comment").find(json).count().exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//查找某一个评论
commentSchema.statics.findOneComment= function (json,callback) {
    this.model("comment").findOne(json).exec(function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//删除评论
commentSchema.statics.delComment= function (json,callback) {
    this.model("comment").remove(json,function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//回复评论
commentSchema.statics.replyComment= function (json,callback) {
    this.model("comment").create(json, function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}

//更新评论

commentSchema.statics.updateComment= function (json,condition,callback) {
    this.model("comment").update(json,condition, function (err,result) {
        if(err){
            console.log(err);
            return
        }
        callback(result)
    })
}


//创建模型
var  commentModel=db.model("comment",commentSchema);


module.exports=commentModel