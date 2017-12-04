/**
 * Created by 侯小贤 on 2016/11/6.
 */

var  mongoose=require("mongoose");
var  db=mongoose.createConnection("mongodb://127.0.0.1:27017/forum");

db.once("open", function (callback) {
    console.log("db is success")
})

module.exports=db;
