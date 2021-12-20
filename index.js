require('dotenv').config()
const mongoose = require('mongoose')
const Remind= require('./models/Remind')
const cron = require('node-cron');
const { Telegraf } = require('telegraf')

mongoose.connect(process.env.MONGODB_CONNECTION_STRING,{useUnifiedTopology:true, useNewUrlParser:true})
const offset=3*60*60*1000
const bot=new Telegraf(process.env.BOT_TOKEN)
const startBot= async () => {
    
    bot.start( async msg=>{
        await msg.reply("Привет, с помощью этого бота ты никогда не забудешь важные вещи для обзора команд введи /help")    
    })
    bot.help(async msg =>{
    const helpMessage="Я бот напоминаю тебе всякую всячину пользуйся следующими командами\n \/addreminder {гггг:мм:дд:чч:мм} | {текст напоминания} - для добавления задачи \n\/listreminder - получить список предстоящих задач\n\/removereminder id={id в списке задач} - для удаления задачи"
    await msg.reply(helpMessage)
    })

    bot.on('message',async msg=>{
        const message=msg.message.text.split(' ',1)
        const chatId=msg.chat.id
        switch (message[0]){
        case "/addreminder":{
        const regexp = /\/addreminder [0-9][0-9][0-9][0-9]:[0-1][0-9]:[0-3][0-9]:[0-2][0-9]:[0-5][0-9] \| .*$/
            if (msg.message.text.match(regexp)){
                const obj={
                    chatId
                }
                obj.date=msg.message.text.match(/[0-9][0-9][0-9][0-9]:[0-1][0-9]:[0-3][0-9]:[0-2][0-9]:[0-5][0-9]/)
                obj.date=obj.date[0].split(':')
                obj.date[1]-=1
                obj.date=new Date(Date.UTC(...obj.date))
                if(obj.date<=new Date(Date.now()+offset)) {await msg.reply("Дата меньше текущей");
                break;
            } 
                obj.text=msg.message.text.match(/\| .*$/g)[0].substring(2)

                const model = new Remind({...obj})
                await model.save()
                await bot.telegram.sendMessage(chatId,"Напоминание сохранено, я напомню как придёт время.")
             }
             else
            await bot.telegram.sendMessage(chatId,'Добавьте пожалуйста необходимые параметры в соответствии с шаблоном')
            break
        }
        case "/listreminder" : {
           Remind.find({chatId},{_id:1,date:1,text:1},async (err,obj)=>{
            if (obj.length!==0)
                {
                    for(let i=0;i<obj.length;i++)
                        {
                            obj[i].date.setHours(obj[i].date.getHours()-3)
                            await msg.reply(`👉 ${obj[i]._id}\n✉️ ${obj[i].text}\n🕰 ${obj[i].date.toLocaleString('ru-RU')}`)
                        }
                }
            else 
                await bot.telegram.sendMessage(chatId,"Предстоящих задач нет")
            })
            break;
        }
        case "/removereminder" :{
            
            const regexp=/\/removereminder id=[a-z0-9]/
            if (msg.message.text.match(regexp)){
            try{
                const id=msg.message.text.split("=").pop()
                
            
            Remind.deleteOne({_id:mongoose.Types.ObjectId(id)}, async (err,obj)=>{
                
                    if(err) await msg.reply("Ошибка пожалуйста повторите попытку позже")
                    if (obj.deletedCount===1) await msg.reply("Напоминание успешно удалено")
                    else await msg.reply("Напоминание с указаным id не найдно пожалуйста повторите попытку")
            })
        }
        catch(e){
        
           await msg.reply("id указан не верно повторите попытку")
        }
        }
        else {
           await bot.telegram.sendMessage(chatId,"Добавьте пожалуйста параметры в соответствии с шаблоном")
        }
            break
        }
        default: {
            await bot.telegram.sendMessage(chatId,"Неправильная команда пожалуйста повторите попытку для обзора введите /help")
        }
    }

})
    
bot.launch()
}
startBot()

cron.schedule('*/1 * * * *',async ()=>{
     let date=new Date(Date.now()+offset)
     date.setMilliseconds(0)
      console.log(date)
      Remind.find({date},{chatId:1,text:1},null, async (err,obj)=>{
          console.log(err, obj)
         for (let i=0; i<obj.length; i++)
            await bot.telegram.sendMessage(obj[i].chatId,obj[i].text,nux)
             
     })
     await Remind.deleteMany({date})
     await Remind.deleteMany({date:{$lt: date}})
  })
  process.once('SIGINT', () => {bot.stop('SIGINT')
 mongoose.connection.close()
 })
 process.once('SIGTERM', () => {bot.stop('SIGTERM')
 mongoose.connection.close()
 })