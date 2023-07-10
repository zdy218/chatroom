<script setup>
import { reactive, onBeforeMount, ref, onMounted } from 'vue'
import { useScoketIo } from '../hooks'
import { getHistory, sendMsg, getAvatarList } from '../utils/'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import 'element-plus/theme-chalk/src/message.scss'
const input = ref(null)
const scrollbarRef = ref(null)
const ul = ref(null)
let username = ''
let isshow = ref(false)
const socket = useScoketIo()
const emits = defineEmits(['addChat'])
const state = reactive({
  msg: '',
  msgList: [],
  avatarList: [],
})
//滚动到底部
const scrollToBottom = () => {
  if (scrollbarRef.value) {
    scrollbarRef.value.setScrollTop(ul.value.scrollHeight)
  }
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
    res = await getAvatarList()
    state.avatarList = res.data.result
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
      emits('addChat')
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

//对应用户头像
const findAvatar = (item) => {
  let obj = state.avatarList.find((t) => t.username == item)
  if (obj?.['avatar']) return obj['avatar']
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
          <li
            v-for="item in state.msgList"
            :key="item.id"
            :class="[item.user == username ? 'msgright' : 'msgleft']"
          >
            <div v-if="item.user == username" class="msg msgright">
              <div class="msgrightbox" style="margin-right: 5px">
                <span class="textuser" style="text-align: right">{{
                  item.user
                }}</span>
                <span class="textmsg boxright"> {{ item.msg }}</span>
              </div>
              <div class="avatarbox">
                <el-avatar
                  shape="square"
                  fit="fill"
                  :size="30"
                  :src="findAvatar(item.user)"
                />
              </div>
            </div>
            <div v-else class="msg msgleft">
              <div class="avatarbox">
                <el-avatar
                  shape="square"
                  fit="fill"
                  :size="30"
                  :src="findAvatar(item.user)"
                />
              </div>
              <div class="msgrightbox" style="margin-left: 5px">
                <span class="textuser">{{ item.user }}</span>
                <span class="textmsg boxleft"> {{ item.msg }}</span>
              </div>
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
    li {
      display: flex;
      flex-direction: row;
    }
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
  flex-direction: row;
}

.msgright {
  justify-content: flex-end;
}
.msgrightbox {
  float: left;
}
.boxright {
  background-color: #64d42c;
  width: fit-content;
  margin-top: 5px;
}
.msgleft {
  justify-content: flex-start;
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
  display: block;
}
.textmsg {
  padding: 3px 8px;
  border-radius: 4px;
  max-width: 240px;
  white-space: pre-wrap;
  word-break: break-all;
  display: block;
}
.avatarbox {
  float: left;
  margin-top: 24px;
}
</style>
