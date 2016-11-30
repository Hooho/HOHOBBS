/**
 * Created by 侯小贤 on 2016/11/5.
 */
var  express=require("express");
var  app=express();
var  cookieParser=require("cookie-parser")
var  session=require("express-session");
var hbs = require("hbs");

var  routers=require("./routers/route.js")

//设置session
app.use(cookieParser())
//使用session
app.use(session({
    name:'hohoID',
    secret:'keyboard cat',
    maxAge:1000,
    resave:true,//每次请求是否重写设置一份新的session
    saveUninitialized:false//无论有没有session cookie，每次请求都设置个session cookie
}))

//模板引擎
app.set('view engine', 'html');
app.set('views', __dirname+'/views');

//运行hbs模块
app.engine('html', hbs.__express);
//设置静态资源

app.use(express.static('public'));
app.use(express.static('avatar'));
app.use(express.static('views'));


//路由函数
//路由表-----------------------------------------------
app.all("*",function(req,res,next){
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
    next()
})
app.get('/',routers.index);
app.get("/web/islogin",routers.islogin);

//用户相关
app.post("/user/login",routers.login)
app.post("/user/regist",routers.regist);
app.get("/user/logout",routers.logout);
app.get("/user/findUser",routers.findUser)
app.get("/user/getAllUser",routers.getAllUser);
app.post("/user/updateUser",routers.updateUser);
app.get("/user/delUser",routers.delUser);

//帖子相关
app.post("/post/setPost",routers.setPost)
app.get("/post/getAllPost",routers.getAllPost)
app.get("/post/getAllPostCount",routers.getAllPostCount);
app.get("/post/updatePost",routers.updatePost)
app.get("/post/delPost",routers.delPost)
app.get("/post/getPersonPost",routers.getPersonPost)
app.get("/post/getPostByTitle",routers.getPostByTitle)
app.get("/post/getDetailPost",routers.getDetailPost);
app.get("/post/setComment",routers.setComment);
app.get("/post/showUserAllComment",routers.showUserAllComment);
app.get("/post/showUserNewComment",routers.showUserNewComment);
app.get("/post/readComment",routers.readComment);



//监听3000端口
app.listen(8888);