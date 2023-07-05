<script setup>
import { reactive } from 'vue'
import { useWebSocket } from '../hooks'
const props = defineProps(['username'])
const ws = useWebSocket(handleMessage)
const state = reactive({
  msg: '',
  msgList: [],
})

const handleSendBtnClick = () => {
  const _msg = state.msg
  if (!_msg.trim().length) {
    return
  }
  ws.send(
    JSON.stringify({
      id: new Date().getTime(),
      user: props.username,
      dateTime: new Date().getTime(),
      msg: state.msg,
    })
  )
  state.msg = ''
}

function handleMessage(e) {
  const _msgData = JSON.parse(e.data)
  state.msgList.push(_msgData)
}
</script>

<template>
  <el-container>
    <el-header class="header">
      <p>敬请期待</p>
    </el-header>
    <el-main class="main"> </el-main>
    <el-footer class="footer"> </el-footer>
  </el-container>
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
    li {
      margin-top: 8px;
      margin-right: 5px;
    }
  }
  .footer {
    height: 90px;
  }
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
.msg {
  display: flex;
  flex-direction: column;
}

.msgright {
  align-items: flex-end;
}
.boxright {
  background-color: #64d42c;
  width: fit-content;
  margin-top: 5px;
}
.msgleft {
  align-items: flex-start;
}
.boxleft {
  background-color: #fff;
  width: fit-content;
  margin-top: 5px;
}
.scrollbar-demo-item {
  height: 30px;
  margin: 20px;
}
.textuser {
  font-size: 12px;
}
.textmsg {
  padding: 3px 8px;
  border-radius: 4px;
  max-width: 100px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
