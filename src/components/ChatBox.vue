<script setup>
import { reactive, onBeforeMount, ref, onMounted } from 'vue'
import { useScoketIo } from '../hooks'
import { getHistory, sendMsg } from '../utils/'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import 'element-plus/theme-chalk/src/message.scss'
const props = defineProps(['username'])
const input = ref(null)
const scrollbarRef = ref(null)
const ul = ref(null)
let username = ''
let isshow = ref(false)
const socket = useScoketIo()
const state = reactive({
  msg: '',
  msgList: [],
})
//滚动到底部
const scrollToBottom = () => {
  scrollbarRef.value.setScrollTop(ul.value.scrollHeight)
}
onBeforeMount(async () => {
  username = localStorage.getItem('username')
  if (!username) {
    router.push('/login')
    return
  }
  try {
    //获取聊天室历史记录
    let res = await getHistory()
    state.msgList = res.data.result
  } catch (e) {
    console.log(e)
  }
  setTimeout(() => {
    scrollToBottom()
  }, 0)
})

//将表情转换未16进制
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g

//接收聊天室的信息
socket.on('$chat', (msg) => {
  const _msgData = JSON.parse(msg)
  state.msgList.push(_msgData)
  setTimeout(() => {
    scrollToBottom()
  }, 1)
})

//点击发送发送聊天
const handleSendBtnClick = async () => {
  const _msg = state.msg
  if (!_msg.trim().length) {
    ElMessage.error('消息内容不能为空!')
    return
  }
  try {
    //聊天内容存储到数据库后，再进行广播
    let res = await sendMsg({ user: username, msg: state.msg })
    if (res.data.code == 200) {
      socket.emit(
        'chat message',
        JSON.stringify({
          id: new Date().getTime(),
          user: username,
          dateTime: new Date().getTime(),
          msg: state.msg,
        })
      )
      state.msg = ''
    }
  } catch (e) {
    console.log(e)
    ElMessage.error('发送失败!')
  }
}
// 将 Emoji 替换为指定的文本
const insertText = (item) => {
  isshow.value = false
  input.value.value = input.value.value + item
  const textWithEmojis = input.value.value.replace(emojiRegex, item)
  state.msg = textWithEmojis
}
</script>

<template>
  <el-container>
    <el-header class="header">
      <p>在线聊天室</p>
    </el-header>
    <el-main class="main">
      <el-scrollbar ref="scrollbarRef">
        <ul ref="ul">
          <li v-for="item in state.msgList" :key="item.id">
            <div
              class="msg"
              :class="[item.user == username ? 'msgright' : 'msgleft']"
            >
              <span class="textuser">{{ item.user }}</span>
              <span
                class="textmsg"
                :class="[item.user == username ? 'boxright' : 'boxleft']"
              >
                {{ item.msg }}</span
              >
            </div>
          </li>
        </ul>
      </el-scrollbar>
    </el-main>
    <el-footer class="footer">
      <el-row>
        <p class="emoji" @click="isshow = !isshow">&#128512;</p>
      </el-row>
      <el-row>
        <input type="text" v-model="state.msg" ref="input" />
      </el-row>
      <el-row class="btnrow">
        <el-button type="success" @click="handleSendBtnClick">发送</el-button>
      </el-row>
    </el-footer>
    <Emoji v-show="isshow" @sendEmoji="insertText" />
  </el-container>
</template>
<style lang="scss" scoped>
.el-container {
  border: 1px solid #ccc;
  position: relative;
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
    height: fit-content;
  }
}
.emoji {
  font-size: 20px;
  &:hover {
    cursor: pointer;
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
  padding-bottom: 10px;
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
  max-width: 250px;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
