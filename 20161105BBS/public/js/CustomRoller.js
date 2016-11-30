//自定义滚动条
var roller = {
	//初始化
	init: function(roll) {
		var rollCls = roll.rollClass;
		var orbitalCls = roll.orbitalClass;
		var content = roll.content; //内容
		var outBox = roll.outBox; //外层盒子

		//传入外层盒子，明确是谁的滚动条
		var roller = this.createRoller(roll);

		var conH = roll.content.height();
		var outH = roll.outBox.outerHeight();

		if(outH > conH){
			roller.css("display", "none");
		}else{
			this.clickRoller(roller, content, outBox);
			this.dragRoller(roller, content, outBox);
			this.rollRoller(roller, content, outBox);
		}


	},
	//创建滚动条
	createRoller: function(roll) {
		//创建滚轮
		var roller = $("<div></div>");
		//创建轨道
		var orbital = $("<div></div>");
		orbital.append(roller);
		roll.outBox.append(orbital)
			//调整滚动条
		this.resizeRoller(roller, orbital, roll);

		return roller;

	},
	//调整滚动条,添加样式
	resizeRoller: function(roller, orbital, roll) {
		//滚轮的高度要计算内容高和显示高的比例
		var conH = roll.content.outerHeight();
		var outH = roll.outBox.outerHeight();
		//内容跟外框的比例==滚动条跟轨道的比例
		var rollRadio = outH * outH / conH;
		//设置样式
		roll.outBox.css({
			"position":"relative",
			"overflow":"hidden"
		})
		roll.content.css({
			"position":"absolute",
			"width":roll.outBox.width()
		})
		orbital.css({
			"position": "absolute",
			"right": 0,
			"top": 0,
			"overflow": "hidden",
			"height":"100%"
		}).addClass(roll.orbitalClass)
		roller.css({
			"position": "absolute",
			"top": 0,
			"width":"100%",
			"height": rollRadio
		}).addClass(roll.rollClass)

	},
	//点击查看
	clickRoller: function(roller, content, outBox) {
		var rollerH = roller.height();
		var orbital = roller.parent();
		var that = this;
		orbital.on("click", function(e) {
			var clickY = e.offsetY;
			//边界值处理
			//判断点击的位置是多大。
			var moveY = (clickY > rollerH) ? clickY - rollerH : clickY
			if(e.target == roller[0]) return;
			that.updateContent(roller, moveY, outBox, content)
		})

	},
	//拖动查看
	dragRoller: function(roller, content, outBox) {
		var orbital = roller.parent();
		var orbitalH = orbital.height();
		var rollH = roller.height()
		var that = this;
		roller.on("mousedown", function(e) {
			//奇怪了，本来我认为这个clickY是相对轨道的，没想到是相对滚轮的
			//而刚好一点击的时候，moveY相对于轨道顶端，clickY相对滚轮，距离就是滚轮距离顶部的距离了。
			//刚点没有移动的时候，moveY-clickY就是滚轮距离上顶部的距离
			//如果clickY不是相对滚轮，那么应该加上已经滚的位置
			e.preventDefault()
			var clickY = e.offsetY;
			//获取已经滚动的距离
			var hasTop = roller.position().top;
			//得到滚轮最大的滚动距离
			var maxRH = orbitalH - rollH;
			//console.log(clickY)
			$(document).on("mousemove", function(e) {
				//得到鼠标距离轨道顶部的距离
				var moveY = e.pageY - orbital.offset().top;
				//console.log(moveY, clickY)
					//得到鼠标滑动的距离
				moveY = moveY - clickY;
				moveY = moveY < 0 ? 0 : moveY
				moveY = moveY > maxRH ? maxRH : moveY
					//console.log(moveY)
				that.updateContent(roller, moveY, outBox, content)
			})
		})
		$(document).on("mouseup",function(){
			$(document).off("mousemove")
		})

	},
	//滚动查看
	rollRoller: function(roller, content, outBox) {
		//放在外面的都是死值
		var orbital = roller.parent();
		var orbitalH = orbital.height();
		var rollH = roller.height()
		var scrollTime = 0;
		var scrollDit = 0
			//得到滚轮最大的滚动距离
		var maxRH = orbitalH - rollH;
		var that = this;

		mouseWheel(outBox[0])

		function mouseWheel(dom) {
			//判断什么浏览器
			var mousewheel = navigator.userAgent.indexOf("Firefox") == -1 ? "mousewheel" : "DOMMouseScroll";
			if(document.addEventListener) {
				dom.addEventListener(mousewheel, function(e) {
					//整数向上，负数向下
					//其他的，其他用wheelDelta -+120,
					//其他浏览器竟然往下是负值，我去，跟火狐相反，我只能转为正值在传过去了
					//火狐的，火狐用detail  -+3
					e.preventDefault()
					var scroll = -e.wheelDelta || (e.detail * 40);
					wheelDealFn(scroll)
				})
			} else {
				dom.attachEvent(mousewheel, function(e) {
					e.preventDefault()
					var scroll = e.wheelDelta;
					wheelDealFn(scroll)
				})
			}
		}

		function wheelDealFn(scroll) {
			//获取已经滚动的距离
			///cons
			var hasTop = roller.position().top;
			
			//把值变小一点，好计算一次滚动多少，120除以12就是10了
			//如果我是加上已经滚动的高度，是不能累计滚动的
			//如果累计的话，应该保存的是把滚动的高度化成滚动的次数
			//if(obj.drag_length>0){
			//drag_length表示已经滚的距离
				//rolling=obj.drag_length*12;
				//obj.drag_length=-1;
			//}
			//rolling+=(-data);//滚了几次,放在后面，避免了拖动后有一次滚动无效
			//roll_flag=(rolling/12);
			//scrollTime += scroll / 12  
			scrollTime = scroll / 12
				//已经滚动的加上滚的
			scrollDit = scrollTime + hasTop;
			

			//边界值计算
			//还要让滚动值相加停止scrollTime=0,否则scrollTime一直增加和减少导致到头后滚动失灵
			scrollDit = scrollDit < 0 ? (scrollTime = 0, 0) : scrollDit;
			scrollDit = scrollDit > maxRH ? (scrollTime = 0, maxRH) : scrollDit

			that.updateContent(roller, scrollDit, outBox, content)
		}
	},
	//根据滚轮更新显示内容
	updateContent: function(roller, rollTop, outBox, content) {
		//获取应该显示哪一部份内容
		//var maxRH=roller.parent().height()-roller.height();
		//var  scrollH=content.height()*rollTop/maxRH
		//  内容滚动的距离/滚轮滚动的距离=内容高度/显示屏高度
		//内容高度除以显示屏高度===多少条滚动条显示的内容
		//console.log(content.height() / outBox.height())
		var scrollH = rollTop * content.height() / outBox.height();

		content.css("top", -scrollH)
		roller.css("top", rollTop)
	}
}