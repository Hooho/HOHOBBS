$(function() {
	//判断是否登录
	islogin(function(result) {
		if(result == 1) {
			$(".comment-list").addClass("canComment")
			$(".tips").hide();
			$(".setComment").show();
		} else {
			$(".comment-list").removeClass("canComment")
			$(".tips").show();
			$(".setComment").hide()
		}
	})

	//获取帖子的id
	var postid = location.search.slice(8);
	//console.log(postid)

	getNewPost()

	//发表评论,直接在那里评论的，都是没有父评论的
	$("#commentBtn").on("click", function() {
		//获取评论内容
		var url = "http://192.168.123.1:8888/post/setComment";
		$.get(url, {
			postid: postid,
			commentContent: $("#commentConet").val()
		}, function(result) {
			console.log(result)
			if(result == "1") {
				alert("评论成功")
				$("#form")[0].reset()
				location.reload()
			} else {
				alert("评论失败")

			}
		})
	})

	function getNewPost() {
		//发请求获取对应的帖子
		$.get("http://192.168.123.1:8888/post/getDetailPost?postid=" + postid, function(result) {
			$(".talk_info .info_avatar img").attr("src", result.avatar);
			$(".talk_info .info_text .author").html(result.author)
			$(".talk_content .title p").html(result.postTitle);
			$(".talk_content .content p").html(result.postContent);
			$(".talk_content").height($(".talk_detail").height())
			$(".talk_info").height($(".talk_detail").outerHeight())
			$("#commentCount span").html(result.commentcount)
				//加载评论------------------------------------------------
				//console.log(result)
				//存储分类父子评论
			var commentColletion = []
				//选出没有lastid的评论
			result.comment.forEach(function(item, index) {
					if(item.commentLastId == "0"||!item.commentLastId) {
						commentColletion.push({
							"parent": item,
							"child": []
						});
					}
				})
				//把子评论组合存进相应的父评论
			commentColletion.forEach(function(item1, index1) {
					var commentChild = [];
					result.comment.forEach(function(item2, index2) {
						if(item2.commentHeaderId == item1.parent._id) {
							item1.child.push(item2)
						}
					})
				})
				//把评论根据时间排序
			commentColletion.forEach(function(item, index) {
					item.child.sort(function(v1, v2) {
						v1 = new Date(v1.commentDate);
						v2 = new Date(v2.commentDate);
						if(v1 > v2) {
							return 1;
						} else if(v1 < v2) {
							return -1;
						} else {
							return 0;
						}
					})
				})
				//console.log(commentColletion)

			commentColletion.forEach(function(item, index) {
				var p = item.parent;
				var c = item.child;
				var date = FormatDate(p.commentDate)
					//item---parent,child
					//加载父评论-------------------------------------------
				var cmtParent = $(
					'<article class="comment" >' +
					'<div class="comment-list-inner clearfix">' +
					'<div class="comment-author">' +
					'<div class="info_avatar">' +
					'<a href=""><img src=' +
					p.avatar + '></a>' +
					'</div>' +
					'<div class="info_text">' +
					'<p class="author">' +
					p.author + '</p>' +
					'</div>' +
					'</div>' +
					'<div class="comment-content">' +
					'<p  class="nestcommentContent">' + p.commentContent + '</p>' +
					'</div>' +
					'<p class="commentDate">发表于 ' + date + '</p>' +
					'<div class="comment-opt">'+
					'<a commentId="' + p._id + '" class="commentfor" href="javascript:;">回复</a>' +
					'<a commentId="' + p._id + '" class="commentDel" href="javascript:;">删除</a>' +
					'</div>'+
					'</div>' +
					'</article>');
				//加载子评论----------------------------------------
				c.forEach(function(item, index) {
					var cmtChild = $(
						'<div class="nestComment clearfix">' +
						'<div><span class="currentAuthor authorname">' +
						item.author +
						'</span><span> &nbsp;回复 &nbsp;</span><span class="lastAuthor authorname">' +
						item.lastAuthor +
						'</span><span>&nbsp; :&nbsp; </span></div>' +
						'<div  class="nestcommentContent">' + item.commentContent + '</div>' +
						'<div class="comment-opt">'+
						'<a commentId="' + item._id + '" class="commentfor" href="javascript:;">回复</a>' +
						'<a commentId="' + item._id + '" class="commentDel" href="javascript:;">删除</a>' +
						'</div>'+
						'</div>');
					cmtParent.append(cmtChild)
				})
				$(".comment-list").append(cmtParent)

			})

		})

	}
})