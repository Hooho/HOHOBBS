/**
 * Created by 侯小贤 on 2016/11/5.
 */
var  formidable=require("formidable");
var  path=require("path");
var  fs=require("fs");
var  userservice=require("../dao/userService.js");
var  postservice=require("../dao/postService.js");
var  commentservice=require("../dao/commentService.js")

//保存所有登陆者
var  usersOnLogin=[];

//首页
exports.index= function (req,res,next) {
    //判断是否登录状态
    res.redirect("homePage.html")
}

//判断登录
exports.islogin= function (req,res,next) {
    //判断是否登录状态
   //console.log(usersOnLogin)
    if(req.session.login=="1"){
        //我只要发送他有多少评论就行了
        var newcommentCount=0
        //查找评论表,找出评论我的人，包括评论我的文章，评论我的回复
        commentservice.findComment({lastAuthorId:req.session.userID}, function (result) {
                //还要判断是不是新评论
            result.forEach(function (item,index) {
               // console.log(item.newCom)
                if(item.newCom=="1"){
                    newcommentCount++;
                }
            })

            var data={
                username:req.session.username,
                avatar:req.session.avatar,
                role:req.session.role,
                newcommentCount:newcommentCount
            }
            res.send(data)

        })
    }else{
        res.send("-1")
    }
}

//注册
exports.regist= function (req, res, next) {
    var form=new formidable.IncomingForm();
    form.parse(req,function (err,fields,file) {
        var username=fields.username;
        var password=fields.password;
        var avatar="male.png";
        var json={
            username:username,
            password:password,
            avatar:avatar,
            registDate:new Date(),
            role:"1"//注册人默认是1，就是会员
        }
        userservice.findOneUser({username:username}, function (result) {
            if(!result){
                //用户名不存在，可以注册
                userservice.insertUser(json, function (result) {
                    if(result){
                        usersOnLogin.push(result);
                        req.session.login="1";
                        req.session.userID=result._id;
                        req.session.username=username;
                        req.session.avatar="male.png";
                        req.session.role="1";
                        res.send("1")
                    }else{
                        //存储错误
                        res.send("-2");
                    }
                })
            }else{
                //用户名存在，注册失败
                res.send("-1")
            }
        })
    })
    
}

//登录
exports.login= function (req, res, next) {
    var form=new formidable.IncomingForm();
    form.parse(req,function (err,fields,file) {
        var username=fields.username;
        var psd=fields.password;
        userservice.findOneUser({username:username}, function (result) {
            //console.log(!result)
            //result是一个数组
            if(!result){
                //用户不存在
                res.send("-2")
            }else{
                var psd2=result.password;
                if(psd2===psd){
                    //登录成功
                    usersOnLogin.push(result);
                    req.session.login="1";
                    req.session.userID=result._id;
                    req.session.username=username;
                    req.session.avatar=result.avatar;
                    req.session.role=result.role;
                    res.send("1")
                }else if(psd2!==psd){
                    //密码错误
                    res.send("-1")
                }
            }
        })
    })
}

//退出登录
exports.logout= function (req, res, next) {
    //获取退出登录者 的id
    var id=req.session.userID
    usersOnLogin.forEach(function (item,index) {
        if(item._id==id){
            usersOnLogin.splice(index,1)
        }
    })
    req.session.destroy();
    res.redirect("http://192.168.123.1:8888/homepage.html")

}

//---------------用户相关----------------------

//更新用户信息
exports.updateUser=function(req,res,next){
    var  form=new formidable.IncomingForm()
    form.uploadDir= path.normalize(__dirname+'/../avatar/') ;
    form.parse(req, function (err,field,file) {
        var username=req.session.username;
        var oldpassword=field.oldPassword;
        var newpassword=field.newPassword;
        var newusername=field.username;
        var json={}
        //是否有上传头像
        if(file.avatar){
            //获取图片类型
            var imgType=file.avatar.type.slice(6);
            var imgName=username+"."+imgType;
            var oldPath=file.avatar.path;
            var newPath=__dirname+"/../avatar/"+imgName;
            json.avatar=imgName
        }
        //查询旧密码是否一样，否则不给改
        userservice.findOneUser({username:username}, function (result) {
            var psd2=result.password;
            if(psd2===oldpassword){
                //密码匹配可以更改
                json.username=newusername;
                json.password=newpassword
                if(file.avatar){
                    //有头像
                    fs.rename(oldPath,newPath, function (err) {
                        if(err){
                            console.log(err)
                            res.send("-1")
                            return ;
                        }
                        //更新用户信息
                        userservice.updateUser({username:username},{$set:json}, function (result) {
                            //console.log(result)
                            if(result.ok==1){
                                req.session.avatar=imgName
                                req.session.username=newusername
                                res.json("1")
                            }else{
                                res.json("-1")
                            }
                        })
                    })

                }else{
                    //没头像
                    userservice.updateUser({username:username},{$set:json}, function (result) {
                        //console.log(result)
                        if(result.ok==1){
                            req.session.username=newusername
                            res.json("1")
                        }else{
                            res.json("-1")
                        }
                    })
                }

            }else if(psd2!==oldpassword){
                //密码不匹配不能更改
                res.send("psderror")
            }
        })


    })

}

//获取用户
exports.findUser= function (req,res,next) {
    var username=req.query.name;
    //console.log(username)
    userservice.findOneUser({username:username}, function (result) {
        if(!result){
            //为空
            res.send("-1")
        }else{
            res.json(result)
        }

    })
}


//--------------帖子相关-----------------------

//发帖,获取登录人的id，作为帖子的外键
exports.setPost= function (req, res, next) {

    if(req.session.username){
        var form=new formidable.IncomingForm();
        form.parse(req,function(err,field,file){
            var  content=field.postContent.split("\n").join("<br\>");
            var  title=field.postTitle;
            var  username=req.session.username;
            if(!username){
                res.send("nologin")
                return ;
            }
            //查找相应的用户的id
            userservice.findOneUser({username:username}, function (result) {

                var  json={
                    authorId: result._id,//用户id
                    postContent:content,//文章内容
                    postTitle:title,//文章标题
                    postDate:new Date()//发表时间
                }
                postservice.setPost(json, function (result) {
                    if(!result){  //失败
                        res.send("-1")
                    }else{ //发表成功
                        res.send("1")
                    }
                })
            })

        })

    }else{
        res.send("nologin")
    }
}

//获取相应的帖子页数
exports.getAllPostCount= function (req,res,next) {
    var username=req.query.name,json;
    //如果查找的是个别用户，那么就要查找他的id，来找他的帖子

    if(username){
        console.log(username)
        userservice.findOneUser({username:username}, function (result) {
            console.log(result)
            postservice.getPostCount({"authorId":result._id}, function (result,count) {
               // console.log(result,count)
                res.json([result,count])
            })
        })
    }else{
        //没有名字查找全部
        postservice.getPostCount({}, function (result,count) {
            //console.log(result,count)
            res.json([result,count])
        })
    }
}

//根据页数获取帖子，但是还要遍历找到用户的头像和姓名
exports.getAllPost= function (req,res,next) {
    var postArr=[];
    //获取页数
    var page=req.query.page;
    postservice.getPagePost({},page,function (posts) {
        //如果找不到帖子
        if(!posts.length) {
            //为空
            res.send("-1")
            return;
        }
        //还要找用户的头像和姓名
        iterator(0)
        //异步用迭代器,说白了不就是递归吗
        function iterator(index){
            //遍历得到每一个帖子
            if(index==posts.length){
                //遍历完啦
                //console.log(22222,posts)
                res.json(posts)
                return;
            }
            var post=posts[index]._doc;
            var  authorId=post.authorId;
            userservice.findOneUser({_id:authorId}, function (result2) {
                post.avatar=result2.avatar;
                post.author=result2.username;
                iterator(index+1)
                //console.log(333,post)
            })
        }
    })
}

//获取用户个人主页所有帖子信息，但是还要遍历找到用户的头像和姓名
//个人主页应该不用遍历找头像和姓名啦
exports.getPersonPost= function (req,res,next) {
    var username=req.query.name;
    var page=req.query.page;
   // console.log(111,username);
    userservice.findOneUser({username:username}, function (result) {
        var  authorId=result._id
        var  avatar=result.avatar;
        var  author=result.username;

        postservice.getPagePost({"authorId":authorId},page, function (posts) {
            //如果找不到帖子
            if(!posts.length) {
                //为空
                res.send("-1")
                return;
            }
            //添加属性,首先posts是一个数组
            posts.forEach(function (item,index) {
                var post=item._doc;
                post.avatar=avatar;
                post.author=author
            })
            //console.log(2222,posts)
            res.json(posts)
        })
    })

}

//获取帖子详情信息,也要找评论，只要帖子id，但是还要遍历找到用户的头像和姓名
exports.getDetailPost= function (req,res,next) {
    var postId=req.query.postid;//帖子id

    //首先有两点要注意
    //1.查找出来的不只是数据
    //2.异步添加属性
    //根据帖子id查找详情信息
    postservice.getDetailPost({_id:postId}, function (post) {
        var authorId=post.authorId;
        var post=post._doc
        if(!post) {
            //为空
            res.send("-1")
        }
        userservice.findOneUser({_id:authorId}, function (user) {
            //先找到这篇帖子的主人，为帖子增加属性
            //再找评论
            //查找评论总数
            commentservice.findAllCommentCount({postId:postId}, function (commentcount) {
                //根据帖子id查找评论
               // console.log(123456,commentcount)
                commentservice.findComment({postId:postId}, function (comments) {
                    //还要找用户的头像和姓名
                    //遍历所有的评论，添加作者和头像
                    iterator(0);
                    function iterator(index){
                        if(index==comments.length){
                            post.avatar=user.avatar;
                            post.author=user.username;
                            post.comment=comments;
                            post.commentcount=commentcount
                            //console.log(post)
                            res.json(post)
                            return ;
                        }
                        var comment=comments[index]._doc;
                        var authorId=comment.authorId;

                        //因为一开始没有给评论设置commentLastId字段，所以他们是undefined
                        //而undefined不等于字符串0，然后就进第一个条件了，最后找不到这个评论而出错
                        if(comment.commentLastId!="0"&&comment.commentLastId!=undefined){
                            commentservice.findOneComment({_id:comment.commentLastId}, function (result) {
                                //console.log(1111,result)
                                userservice.findOneUser({_id:result.authorId}, function (result) {
                                    comment.lastAuthor=result.username;
                                    findCommentLastAuthor()
                                })
                            })
                        }else{
                            findCommentLastAuthor()
                        }
                        function  findCommentLastAuthor(){
                            //遍历为评论找主人
                            userservice.findOneUser({_id:authorId}, function (user) {
                                comment.avatar=user.avatar;
                                comment.author=user.username;
                                iterator(index+1)
                            })
                        }


                    }
                })
            })

        });
    })
}

//根据标题查找帖子，但是还要遍历找到用户的头像和姓名
exports.getPostByTitle= function (req,res,next) {
    var title=req.query.title;
    postservice.getPost({postTitle:title}, function (result) {
        if(!result.length){
            //为空
            res.send("-1")
        }else{
            res.json(result)
        }
    })
}

//更新帖子，本来是用来更新评论的，但是后面想想多余了
exports.updatePost=function(req,res,next){

}

//删除帖子,也要删除评论
exports.delPost=function(req,res,next){
    //获取到帖子的id
    var  id=req.query.postid;
    postservice.delPost({_id:id}, function (result) {
        //console.log(result)
        commentservice.delComment({postId:id}, function (result2) {
            //console.log(result2)
            res.json(result2)
        })
    })
}


//-----------------评论-----------------------

//发表评论，获取到帖子的id和用户的id，
// 成功之后提示帖子主人，根据帖子id找到用户
exports.setComment= function (req,res,next) {

    //帖子id，因为我是给每个标题加上帖子的id，所以可以在url知道网址
    var  postid=req.query.postid;

    if(!postid) {
        console.log("postid 为空")
        res.send("-1")
        return ;
    }
    //评论的内容
    var  comment=req.query.commentContent;
    //上一个评论，可能有可能没有,有就是你点击回复的那个人的评论id
    var  commentLastId=req.query.commentLastId||0;
    //发评论的人就是登录的人
    var  authorId=req.session.userID;
    if(!authorId) {
        console.log("authorId 为空")
        res.send("-1")
        return ;
    }
    //评论时间
    var  date=new Date();
    //可能有可能没有，需要查
    var  commentHeaderId=0;
    //你评论的是谁,如果是自己回复自己，仍然要给帖子的主人评论+1
    //那么lastAuthorId应该是这篇帖子的主人id
    var  lastAuthorId=0;

    var  newCom=1 ;//默认是新评论，但是自己评论自己不是新评论

    console.log(postid,comment,commentLastId,authorId)
    //如果上一个评论的commentLastId存在，
    // 我就去寻找上一个评论的commentHeaderId；
    //如果回复的是评论
    if(commentLastId){
        commentservice.findOneComment({_id:commentLastId},function(result){
            //如果上一个评论的commentHeaderId不存在
            //因为如果是第一个次评论，我的commentHeaderId是没有办法设置的
            //console.log(result.commentHeaderId)
            if(!parseInt(result.commentHeaderId)){
                commentHeaderId= result._id;
               // console.log(1111,commentHeaderId)
            }else{
                //找到回复的那个评论的commentHeaderId
                commentHeaderId= result.commentHeaderId;
                //console.log(222,commentHeaderId)
            }
            //_id是commentLastId的人就是被评论的人，我评论的人
            //这里要判断是不是评论自己
            //自己评论自己,lastAuthorId不为0，为这篇帖子的主人id
            if(result.authorId!=req.session.userID){
                lastAuthorId=result.authorId;
                addComment()
            }else{
                //找到帖子主人的id
                postservice.getDetailPost({_id:postid}, function (result) {
                    lastAuthorId=result.authorId;
                    addComment()
                })
            }
        })
    }else{
        //如果是第一次评论，那么我就找到这篇文章是谁的
        postservice.getDetailPost({_id:postid}, function (result) {
            //评论自己的文章也不行
            //自己评论自己,lastAuthorId为文章主人id
            lastAuthorId=result.authorId;
            //但是自己也会评论自己
            if(result.authorId==req.session.userID){
                newCom=0
            }
            addComment()
        })

    }
    function addComment(){
        var json={
            authorId:authorId,
            postId:postid,
            commentContent:comment,
            commentDate:date,
            commentLastId:commentLastId,
            commentHeaderId:commentHeaderId,
            newCom:newCom,//当然是默认都是新评论
            lastAuthorId:lastAuthorId
        }
        //console.log(json)
        commentservice.addComment(json, function (result) {
           // console.log(666666666666,result)
            if(!result){
                res.send("-1")
            }else{
                res.send("1")

            }
        })
    }

}

//查看了评论，把帖子的评论增加标识设置0
exports.readComment= function (req,res,next) {
    var postid=JSON.parse(req.query.postId);
    console.log(postid)

    //postservice.updatePost({_id:postid},{$set:{hasnewComment:0}}, function (result) {
    //    console.log("评论已查看",result)
    //})

}

//回复评论,得到祖宗的评论的id，回复那个评论的id，帖子的id，用户的id
exports.replyComment= function (req,res,next) {

}

//查看登录用户所有的评论，找到用户所有的帖子，找到帖子所有的评论,
exports.showUserAllComment= function (req,res,next) {
    //登录人的id
    var id=req.session.userID;
    var userPosts={
        author:req.session.username,
        avatar:req.session.avatar,
        post:[]
    }

    //他所有的帖子
    postservice.getAllPost({authorId:id}, function (posts) {

        //这个人没有发过帖子，直接不用遍历
        if(!posts.length){
            res.send("nopost")
            return ;
        }
        iterator1(0);
        //第一个迭代器，为每个帖子增加评论
        function iterator1(index1){
            if(index1==posts.length){

                res.json(userPosts)
                return ;
            }
            var  post=posts[index1]._doc;
            var  postid=post._id;
            commentservice.findComment({postId:postid}, function (comments) {

               // console.log(1111,comments)
                //这篇帖子没有评论,直接执行下一篇帖子
                if(!comments.length){
                    //console.log(comments)
                    iterator1(index1+1)
                    return;
                }
                var commentsarr=[]
                iterator2(0);
                //第二个迭代器,为每个评论添加姓名
                function iterator2(index2){
                    if(index2==comments.length){
                        post.comments=commentsarr;
                        userPosts.post.push(post)
                        iterator1(index1+1)
                        return ;
                    }
                    //console.log(444,comments)
                    var  comment=comments[index2]._doc;
                    var  authorId=comment.authorId;
                    //console.log(444,comment)
                   // console.log(111,comment.commentLastId)
                    //如果commentLastId存在，就找到上一个人的名字
                    if(comment.commentLastId!="0"&&comment.commentLastId!=undefined){
                       // console.log(22222,result)
                        commentservice.findOneComment({_id:comment.commentLastId}, function (result) {
                            console.log(22222,result)
                            userservice.findOneUser({_id:result.authorId}, function (result) {
                                comment.lastAuthor=result.username;
                                findCommentAuthor()
                            })
                        })
                    }else{
                        findCommentAuthor()
                    }
                    function findCommentAuthor(){
                        userservice.findOneUser({_id:authorId}, function (user) {
                            comment.author=user.username;
                            //console.log(comment)
                            commentsarr.push(comment)
                            iterator2(index2+1)
                        })
                    }

                }

            })
        }
    })
}

//查看新评论,评论包括来自哪篇文章，文章的主人
exports.showUserNewComment= function (req,res,next) {
    var  userId=req.session.userID;
    if( !userId){
        console.log("用户没登录")
        res.send("-1")
        return ;
    }
    commentservice.findComment({lastAuthorId:userId}, function (comments) {
        //找到所有关于你的评论
        if(!comments.length){
            //没有新评论
            res.send("-1")
            return ;
        }
        var myComment=[];
        iterator(0);
        function iterator(index1){
            if(comments.length==index1){
                //评论遍历完了
                //console.log(myComment)
                res.json(myComment)
                return ;
            }
            var comment=comments[index1]._doc;
            var postid=comment.postId;
            //如果是回复我的，就保存起来
            //评论所属文章
            if(comment.newCom=="1"){
                postservice.getDetailPost({_id:postid}, function (post) {
                    //文章主人
                    userservice.findOneUser({_id:post.authorId}, function (user) {
                        //这里还要做多一步，就是把新评论置为旧评论
                        commentservice.updateComment({_id:comment._id},{$set:{"newCom":0}}, function (result){
                            //评论主人
                            userservice.findOneUser({_id:comment.authorId}, function (result){
                                comment.postTitle=post.postTitle;//所属文章标题
                                comment.authorAvatar=result.avatar//评论人头像
                                comment.authorName=result.username//评论人名字
                                comment.postAuthor=user.username;//所属文章作者
                                comment.postAvatar=user.avatar;//所属文章作者
                                //存在回复的上一条说说
                                //console.log(1111,comment.commentLastId)
                                if(comment.commentLastId!="0"){
                                    commentservice.findOneComment({_id:comment.commentLastId}, function (lastComment){
                                        comment.lastCommentContent=lastComment.commentContent//上一条回复内容
                                        //上一条说说人的名字
                                        userservice.findOneUser({_id:lastComment.authorId}, function (lastAuthor){
                                            comment.lastAuthor=lastAuthor.username//上一条说说名字
                                            myComment.push(comment)//评论组装完毕，可以放进来了
                                            iterator(index1+1)
                                        })
                                    })
                                }else{
                                    myComment.push(comment)//评论组装完毕，可以放进来了
                                    iterator(index1+1)
                                }
                            })
                        })

                    })
                })
            }else{
                iterator(index1+1)
            }

        }
    })
}

//管理员权限-----------------------------------------

//管理员获取所有注册用户
exports.getAllUser= function (req, res, next) {
    var page=req.query.page;
    userservice.findAllUser(page, function (result,count) {
        usersOnLogin.forEach(function (item2) {
            result.forEach(function (item1) {
                //console.log(item2.username,item1.username,item2.username==item1.username)
                if(item2.username==item1.username){
                    item1._doc.islogin=1;
                    //console.log(item1._doc)
                }
            })
        })
        res.json({user:result,count:count})
    })
}

//管理员可以删除用户
exports.delUser= function (req, res, next) {
    var id=req.query.userid;
    //console.log(id)
    userservice.delUser({_id:id}, function (result) {
            res.json(result)
    })
}
