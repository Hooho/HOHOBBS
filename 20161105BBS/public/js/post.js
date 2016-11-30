/**
 * Created by 侯小贤 on 2016/11/7.
 */
//检查是否登录状态
function islogin(callback){

    $.get("http://192.168.123.1:8888/web/islogin",function(result){
        //console.log(result)
        if(result!="-1"){
            //已经登录
           // console.log(result)
            $(".user").show();
            $(".login").hide();
            sessionStorage.setItem("login",1);
            sessionStorage.setItem("loginer",result.username);
            sessionStorage.setItem("loginAvatar",result.avatar);
            sessionStorage.setItem("loginRole",result.role);
            sessionStorage.setItem("newComment",JSON.stringify(result.newComment));
            $("#username").html(result.username)

            //只有新评论不为0的时候，才显示提示框
            if(parseInt(result.newcommentCount)){
                $(".commentPrompt").fadeIn(500);
                $(".commentPrompt .comment-inner").html("你有新评论哦");
                $(".newCount").html(result.newcommentCount)
            }else{
                $(".commentPrompt").hide(500);
            }
            if(callback){
                callback(1,result)
            }
            $("#personPage").attr("href","http://192.168.123.1:8888/personPage.html?name="+result.username)
        }else{
            //没有登录
            if(callback){
                callback(-1,result)
            }
            $(".user").hide();
            $(".login").show();
            sessionStorage.removeItem("login");
            sessionStorage.removeItem("loginer");
            sessionStorage.removeItem("loginAvatar");
            sessionStorage.removeItem("loginRole")
            sessionStorage.removeItem("newComment");
        }
    })
}

//获取帖子
function getpost(url,page){

    $.get(url+page, function(result) {

        $(".post-wrap").empty()
        //console.log(111,result)
        result.forEach(function(item, index) {
            var date=FormatDate(item.postDate)
            var article = [
                '<article class="talk">',
                '<div class="talk_info">',
                '<div class="info_avatar">',
                '<a  target="_blank" href="http://192.168.123.1:8888/personPage.html?name=',item.author,
                ,'">',
                '<img src=',item.avatar ,'></a>',
                '</div>',
                '<div class="info_text">',
                    '<p class="author">',item.author ,'</p>',
                    '<p>', date, '</p>',
                '</div>',
                '<a class="delPost" postid="',
                item._id,'">','删除该帖子</a>',
                '</div>',
                '<div class="talk_content">',
                '<div class="title">',
                '<p><a href="http://192.168.123.1:8888/detailPage.html?postid=',
                item._id,'" target="_blank">',
                item.postTitle,
                '</a></p>',
                '</div>',
                '<div class="content">',
                '<p>', item.postContent, '</p>',
                '</div>',
                '</div>',
                '</article>'
            ].join("");

            $(".post-wrap").append($(article));

        })
    })

    //删除帖子
    $(".post-wrap").on("click",".delPost",function(){
       var url= "http://192.168.123.1:8888/post/delPost?postid=";
        var postid=$(this).attr("postid");

        if(confirm("你确定删除该帖子吗")){
            $.get(url+postid, function (result) {
                console.log(result)
                if(result.ok==1){
                    alert("删除成功")
                    location.reload()
                }
                console.log(result)
            })
        }
    })
}

//获取用户
function getUser(name,callback){
    $.get("http://192.168.123.1:8888/user/findUser?name="+name,callback);
}

//时间格式化
function FormatDate (date) {
    var date=new Date(date)
    return date.toLocaleDateString()+" "+date.toLocaleTimeString();
}

//获取帖子总数
function getPostCount(url,callback){

    $.get(url, function (result) {
       // console.log(result[0],result[1])
        callback(result[0],result[1])
    })
}

$(function () {
	var  commentLastId=0;
	var  PostId=0
	//提示框的点击事件
    $(".iknow").children().click(function () {
        if($(this).html()=="取消"){
            $(".commentPrompt").fadeOut();
            return;
        }else{
            //详情
            $(".shadeBg").show()
            $(".showNewComment").addClass("on")

           // console.log(postid)

            $.get("http://192.168.123.1:8888/post/showUserNewComment", function (result) {
                createNewComment(result)
                console.log(result)
                roller.init({
                    rollClass:"roller",
                    orbitalClass:"orbital",
                    content:$(".showNewComment-content"),
                    outBox:$(".showNewComment-inner")
                })
            })
        }
    })
    //关闭新评论框
    $("#closeShow").click(function(){
        $(".commentPrompt").fadeOut()
        $(".showNewComment").removeClass("on")
        setTimeout(function(){
        	$(".shadeBg").hide()
        },300)
    	
    })

    //点击回复
    $(".comment-list").on("click",".commentfor", function () {
    	$(".commentforPrompt").addClass("show")
       	commentLastId=$(this).attr("commentid")

        $("#commentforlast").focus();
        //判断点击的那个回复的祖先元素是什么
        //这个是userComment的，
        if($(this).parents(".comment-wrap").length){
            PostId = $(this).parents(".comment-wrap").attr("postid");
        }
        //这个是新评论提示框的，homepage，detailPage，personPage里面的
        if($(this).parents(".newComment-wrap").length){
            PostId = $(this).parents(".newComment-wrap").attr("postid");
            console.log(PostId)
        }
      
        
		//console.log(postid)
    })
    
    //删除回复
     $(".comment-list").on("click",".commentDel", function () {
     	alert()
    })
     
     //取消回复
    $("#cancelComment").on("click",function(){
    	$(".commentforPrompt").removeClass("show")
    })
    
    //提交回复
    $("#submitComment").on("click",function(){
        //console.log(commentLastId)
		//获取帖子的id
		var postid = location.search.slice(8)?location.search.slice(8):PostId;
        console.log(postid)
		
        $.get("http://192.168.123.1:8888/post/setComment", {
        	postid: postid,
			commentContent: $("#commentforlast").val(),
			commentLastId: commentLastId
        },function (result) {
        	console.log(result)
			if(result == "1") {
				alert("评论成功")
				if($("#form")[0]){
					$("#form")[0].reset()
				};
				$("#commentforlast").val()
				location.reload()
			} else {
				alert("评论失败")

			}
        })
    })
    
    //创建新评论
    function createNewComment(result){
        $(".showNewComment-content").empty()
        console.log(result)
        result.forEach(function (item,index) {
            var  date=FormatDate(item.commentDate);
            var  comment=$(
                '<article class="newComment-wrap" postid="'+item.postId+'">'+
                '<div class="newComment-part">'+
                '<div class="newComment-info clearfix">'+
                '<div class="newCommentAvatar">'+
                '<img src="'+item.authorAvatar+'"/>'+
                '</div>'+
                '<div class="newCommenttext">'+
                '<p>'+item.authorName+'</p>'+
                '<p>'+date+'</p>'+
                '</div>'+
                '</div>'+
                '<div class="newComment-content"><p>'+
                item.commentContent+
                '</p><div class="newComment-opt">'+
                '<a href="javascript:;" class="commentfor" commentId="'+item._id+'">回复</a>'+
                '<a href="http://192.168.123.1:8888/detailPage.html?postid='+item.postId+'">详情</a>'+
                '</div></div></div>'+
                '<div class="post-part">'+
                '<div class="postAvatar">'+
                '<img src="'+item.postAvatar+'"/>'+
                '</div>'+
                '<div class="postAuthorName">'+
                '<a href="javascript:;">'+item.postAuthor+' </a>:' +
                '</div>'+
                '<div class="posttitle">'+
                item.postTitle+
                '</div>'+
                '</div>'+
                '</article>');
            if(item.lastAuthor){
            	var lastComment=$(
            		 '<div class="lastComment">'+
			        	'<div class="lastAuthor">'+
			        		'<span>你</span>'+
			        		'<span>回复 </span>'+
			        		'<span>'+item.authorName+'</span>'+
			        		'<span> : </span>'+
			        	'</div>'+
			        	'<div class="lastContent">'+item.lastCommentContent+'</div>'+
		        	'</div>'
            	)
            	comment.append(lastComment)
            }
            $(".showNewComment-content").append(comment);
           
        })
    }
})
