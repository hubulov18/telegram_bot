const {Schema, model} = require('mongoose')

const schema = new Schema({
    chatId:{type:String, required:true},
    text:{type:String, required:true},
    date:{type:Date, required:true},
})

module.exports = model("Remind",schema)