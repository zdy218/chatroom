<script setup>
import { reactive,onBeforeMount ,ref} from 'vue'
import { useWebSocket } from '../hooks'
import {getHistory,sendMsg}  from '../utils/';
import { ElMessage } from 'element-plus'
import  Emoji from './emoji.vue';
const props = defineProps(['username'])
const ws = useWebSocket(handleMessage)
const input=ref(null)
let username='';
let isshow=ref(false)
const state = reactive({
  msg: '',
  msgList: [],
})
onBeforeMount(async() => {
  username = localStorage.getItem('username')
  if (!username) {
    router.push('/login')
    return
  }
  try{
    let res=await getHistory();
    state.msgList=res.data.result;
  }catch(e){
    console.log(e)
  }
})
const handleSendBtnClick = async() => {
  const _msg = state.msg
  if (!_msg.trim().length) {
    return
  }
  try{
    
    let res = await sendMsg({user:username,msg:state.msg});
    console.log(res)
    if(res.data.code==200){
      ws.send(
      JSON.stringify({
      id: new Date().getTime(),
      user: username,
      dateTime: new Date().getTime(),
      msg: state.msg,
    })
  )
    state.msg = ''
    }
  }
  catch(e){
    console.log(e);
    ElMessage.error('发送失败!');
  }
  
}

function handleMessage(e) {
  const _msgData = JSON.parse(e.data)
  state.msgList.push(_msgData)
}
const insertText=(item)=>{
    isshow.value=false;
    input.value.value=input.value.value+item;
     console.log(item)
}
</script>

<template>
  
  <el-container>
    <el-header class="header">
      <p>在线聊天室</p>
    </el-header>
    <el-main class="main">
      <el-scrollbar>
      <ul>
          <li
            v-for="item in state.msgList"
            :key="item.id"
          >
          
            <p >
              <div class="msg" :class="[item.user == username ? 'msgright' : 'msgleft']">
              <span class="textuser">{{ item.user }}</span>
              <span class='textmsg' :class="[item.user == username ? 'boxright' : 'boxleft']"> {{ item.msg }}</span>
             </div>
            </p>
          
          </li>
        </ul>
      </el-scrollbar>
    </el-main>
    <el-footer class="footer">
      <el-row>
        <p class="emoji" @click="isshow=true">&#128512;</p>
      </el-row>
      <el-row>
        <input type="text" v-model="state.msg" ref="input"/>
      </el-row>
      <el-row class="btnrow">
        <el-button type="success" @click="handleSendBtnClick">发送</el-button>
      </el-row>
    </el-footer>
  </el-container>
  <Emoji v-show="isshow" @sendEmoji="insertText"/>
</template>
<style lang="scss" scoped>
.el-container {
  border: 1px solid #ccc;
  max-width: 550px;
  min-width: 300px;
  background-color: #f4f4f4;
  ul {
    padding: 0;
    list-style: none;
  }
  .header {
    height: 50px;
    display: flex;
    align-items: center;
    flex-direction: row;
    border-bottom: 1px solid #ccc;
  }
  .main {
    height: 300px;
    border-bottom: 1px solid #ccc;
    li{
      margin-top: 8px;
      margin-right: 5px;
    }
  }
  .footer {
    height: 110px;
    
  }
}
.emoji:hover{
  cursor: pointer;
}
input {
  padding-top: 10px;
  width: 100%;
  outline: none;
  border: none;
  background-color: #f4f4f5;
}
.btnrow {
  padding-top: 20px;
  display: flex;
  flex-flow: row-reverse;
  .el-button {
    background-color: #e7e4e4;
    border: none;
    color: #64d42c;
  }
}
.msg{
  display: flex;
  flex-direction: column;
  
}

.msgright {
  align-items: flex-end; 
}
.boxright{
  background-color: #64d42c;
  width:fit-content;
  margin-top: 5px;
}
.msgleft {
  align-items: flex-start; 
}
.boxleft{
  background-color: #fff;
  width:fit-content;
  margin-top: 5px;
}
.scrollbar-demo-item {
  height: 30px;
  margin: 20px;
}
.textuser{
  font-size: 12px;
}
.textmsg{
  padding: 3px 8px;
  border-radius: 4px;
  max-width: 100px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
