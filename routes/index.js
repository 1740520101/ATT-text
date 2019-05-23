const router = require('express').Router()
const path = require('path');
const md5 = require('md5');
/* const mysql = require('mysql'); */
const db = require('../models/mysql')
const { User } = require('../models/user')

const viewPath = path.join(__dirname,'../views')


router.get('/', (req, res) => {
    if(req.session && req.session.user){
        const htmlPath = viewPath + ('/card.html')
        res.sendFile(htmlPath);
    }else{
        res.redirect('/login')
    }
});

router.get('/login',(req,res)=>{
    const signinPath = viewPath + '/login.html'
    res.sendFile(signinPath)
})

router.get('/reg',(req,res)=>{
    const signupPath = viewPath + '/reg.html'
    res.sendFile(signupPath)
})


const regName = /^[a-zA-Z]\w{3,}///正则表达式


router.post('/main',(req,res)=>{
    if(req.session&&req.session.user){
        const { user } =req.session
        res.json({
            code:0,
            data:{
                cash:user.cash
            }
        })
    }else{
        res.redirect('/reg')
    }
})



router.post('/reg', (req, res) => {
    const username = req.body.username
    const pass_hash = req.body.password
    if (!username){
        res.json({
            err: 1,
            msg: '请输入用账号!'
        })
        return
    }else
    if(!regName.test(username)){
        res.json({
            err: 1,
            msg: '用户名不规范!'
        })
        return
    }else
    if (!pass_hash){
        res.json({
            err: 1,
            msg: '请输入用密码!'
        })
        return
    }else
    if (!req.body.repassword){
        res.json({
            err: 1,
            msg: '请输入密码!'
        })
        return
    }else 
    if(req.body.repassword!=pass_hash){
        res.json({
            err: 1,
            msg: '两次输入密码不一致!'
        })
        return
    }
    User.find(username,(err,user)=>{
        if(err){
            console.error('find user failed:',err.message)
            res.json({
                err:1,
                msg:err.message
            })
            return
        }
        if(user){
            res.json({
                err:1,
                msg:'用户已存在!'
            })
            return
        }
    })
    let salt;//撒盐
    let j =0;
    result=new Array(8).fill(null);;
    j=0
    while(j<8){
        let Z= Math.floor(Math.random()*55);//取出字母
        if(Z>90&&Z<97){
            Z+=6
        }
        Z = String.fromCharCode(65+Z)
        if(!result.includes(Z)){
            result[j] = Z;
            j++;
        }
    }
    for(j=0;j<8;j++){
        salt += result[j]
    }
    User.create({username,pass_hash,salt},err=>{
        if(err){
            res.json({
                err:1,
                msg:'创建用户失败'
            })
        }else{
            res.json({
                err:0,
                msg:'创建用户成功'
            })
        }
    })
}),


router.post('/login', (req, res) => {
    const username = req.body.username
    User.find(username,(err,user)=>{
        if(err){
            console.error('find user failed:',err.message)
            res.join({
                err:1,
                msg:err.message
            })
            return
        }
        if(user){
            let password = md5(req.body.password+user.salt)
            if(user.pass_salt!==password){
                res.join({
                    err:1,
                    msg:"密码错误"
                })
                return
            }
            user.gameStart = false
            user.gameCards = ''
            req.session.user = user

            res.json({
                err:0,
                msg:"登录成功!"
            })
        }else{
            res.json({
                err:1,
                msg:"用户错误"
            })
            return
        }
    })
});


module.exports = router