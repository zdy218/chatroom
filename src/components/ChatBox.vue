<script setup>
import { reactive, onBeforeMount, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  useScoketIo,
  useTime,
  useHandleRes,
  useThrottle,
  useUploadFile,
} from '../hooks'
import { getHistory, sendMsg, getAvatarList } from '../utils/'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import { Folder } from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/src/message.scss'
import { stroageOnlineImage } from '../utils/'
import MultipleMsgList from './MultipleMsgList.vue'
const input = ref(null)
const scrollbarRef = ref(null)
const ul = ref(null)
let username = ''
let isshow = ref(false)
const socket = useScoketIo()
const router = useRouter()
const { handleRes } = useHandleRes()
const { throttle } = useThrottle()
const { start } = useUploadFile()
const handleResThrottle = throttle(handleRes, 50)
const { handleTime, handleAddTime, compareAddTime } = useTime()
const emits = defineEmits(['addChat'])
const state = reactive({
  msg: '',
  msgList: [],
  avatarList: [],
})
let scro = ref(false)
let sf = ref()
let srcList = ref([])
let latsedTime = ref('')
//滚动到底部
const scrollToBottom = () => {
  if (scrollbarRef.value) {
    scrollbarRef.value.setScrollTop(ul.value.scrollHeight)
  }
}
let fileSuffixList = [
  'text/plain',
  'application/pdf',
  'application/x-zip-compressed',
]
onBeforeMount(async () => {
  username = localStorage.getItem('username')
  if (!username) {
    router.push('/login')
    return
  }
  try {
    //获取聊天室历史记录
    let res = await getHistory()
    handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      state.msgList = res.data.result
      let timestr = state.msgList[state.msgList?.length - 1]?.time
      latsedTime.value = timestr
      state.msgList.forEach((item) => {
        item.time = handleTime(item.time)
      })
      let scrarr = res.data.result.filter((item) => item.type === 'image')
      srcList.value = scrarr.map((item) => item.msg)
    }
    res = await getAvatarList()
    handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
    state.avatarList = res.data.result ? res.data.result : null
  } catch (e) {
    console.log(e)
  }
  setTimeout(() => {
    scrollToBottom()
  }, 1)
})

//将表情转换未16进制
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g

//接收聊天室的信息
socket.on('chat', (msg) => {
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
    handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)

    if (res.data.result) {
      let time = res.data.result.time

      socket.emit(
        'chat message',
        JSON.stringify({
          id: new Date().getTime(),
          user: username,
          time: handleAddTime(latsedTime.value, time),
          msg: state.msg,
          type: 'text',
        })
      )
      if (!compareAddTime(latsedTime.value, time)) {
        latsedTime.value = time
      }
      emits('addChat', { msg: state.msg, user: username })
      state.msg = ''
    }
  } catch (e) {
    console.log(e)
    ElMessage.error('发送失败!')
  }
}
const handleSendEnterMsg = () => {
  handleSendBtnClick()
  input.value.blur()
}
// 将 Emoji 替换为指定的文本
const insertText = (item) => {
  isshow.value = false
  input.value.value = input.value.value + item
  const textWithEmojis = input.value.value.replace(emojiRegex, item)
  state.msg = textWithEmojis
  input.value.focus()
}

//对应用户头像
const findAvatar = (item) => {
  let obj = state.avatarList.find((t) => t.username == item)
  if (obj?.['avatar']) return obj['avatar']
}
const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  sf.value = e.target.files[0]
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = async (event) => {
      // 将文件内容转换为二进制数据并发送
      const blob = new Blob([event.target.result])
      const data = { file: blob, type: file.type, name: file.name }

      const url = URL.createObjectURL(blob)
      setTimeout(() => {
        scrollToBottom()
      }, 1)
      emits('addChat', { msg: '[图片]', user: username })
      let formData = new FormData()

      formData.append('imageStore', sf.value)
      let res = await stroageOnlineImage({
        data: { sender: username, index: srcList.value.length },
        formData,
      })
      handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
      if (res.data.result) {
        let { imageUrl, lastedRow } = res.data.result
        socket.emit('sendOnlineFile', {
          user: username,
          msg: imageUrl,
          type: 'image',
          time: lastedRow.time,
        })
      }
    }
  } else if (fileSuffixList.includes(file.type)) {
    let res = await start(sf.value, username, '', file.type)
    let { result } = res
    handleResThrottle(ElMessage, router, res.code, res?.msg)

    socket.emit('sendOnlineFile', {
      user: username,
      msg: file.name,
      type: file.type,
      time: result.time,
    })
    setTimeout(() => {
      scrollToBottom()
    }, 1)
  } else {
    return ElMessage.error('仅支持图片,文本,PDF,ZIP格式')
  }
}
socket.on('sendOnlineFile', ({ user, msg, type, time }) => {
  if (type.startsWith('image')) {
    state.msgList.push({
      id: new Date().getTime(),
      user: user,
      time: handleAddTime(latsedTime.value, time),
      msg,
      type: 'image',
      index: srcList.value.length,
    })
    if (!compareAddTime(latsedTime.value, time)) {
      latsedTime.value = time
    }
    srcList.value.push(msg)
    setTimeout(() => {
      scrollToBottom()
    }, 1)
  } else {
    state.msgList.push({
      id: new Date().getTime(),
      user,
      msg,
      time: handleAddTime(latsedTime.value, time),
      type,
    })
    if (!compareAddTime(latsedTime.value, time)) {
      latsedTime.value = time
    }
    emits('addChat', { msg, user })
    setTimeout(() => {
      scrollToBottom()
    }, 1)
  }
})
const handleSendFile = () => {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.addEventListener('change', handleFileSelect)
  fileInput.click()
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
          <MultipleMsgList
            :msgList="state.msgList"
            :srcList="srcList"
            :avatarList="state.avatarList"
            :username="username"
          />
        </ul>
      </el-scrollbar>
    </el-main>
    <el-footer class="footer">
      <el-row>
        <p class="emoji" @click="isshow = !isshow">&#128512;</p>
        <el-icon class="folder" @click="handleSendFile"><Folder /></el-icon>
      </el-row>
      <el-row>
        <input
          type="text"
          v-model="state.msg"
          ref="input"
          @keyup.enter="handleSendEnterMsg"
          id="input"
          name="names"
          autocomplete="off"
        />
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
  width: 500px;
  min-width: 300px;
  background-color: #f4f4f4;
  ul {
    padding: 0;
    list-style: none;
    li {
      display: flex;
      flex-direction: column;
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
.folder {
  font-size: 20px;
  margin-left: 10px;
  margin-top: 7px;
  &:hover {
    cursor: pointer;
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
.timebox {
  margin: 0 auto;
  p {
    text-align: center;
    font-size: 12px;
  }
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
