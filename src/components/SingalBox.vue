<script setup>
import { reactive, onBeforeMount, ref, toRef, watch, h, onMounted } from 'vue'
import { useTime, useHandleRes, useThrottle, useUploadFile } from '../hooks'
import {
  getSingalHistory,
  sendSingalMsg,
  stroageImage,
  getOnlineStatu,
  fileUpload,
} from '../utils/'
import SingalMsgList from './SingalMsgList.vue'
import Peer from 'peerjs'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import 'element-plus/theme-chalk/src/message.scss'
import { useRouter } from 'vue-router'
import { VideoCamera, Folder } from '@element-plus/icons-vue'
import { uploadUrl, fileuploadUrl } from '../configs'

const router = useRouter()
const { handleRes } = useHandleRes()
const { throttle } = useThrottle()
const { start } = useUploadFile()
const handleResThrottle = throttle(handleRes, 50)
const props = defineProps([
  'name',
  'avatar',
  'otheruser',
  'socket',
  'otheravatar',
])

const socket = toRef(props, 'socket')
const name = toRef(props, 'name')
const input = ref(null)
const scrollbarRef = ref(null)
const ul = ref(null)
let srcList = ref(null)
let username = ''
let isshow = ref(false)
let videoshow = ref(false)
let video = ref(false)
let dialogVisible = ref(false)
let videoreciever = ref('')
const emits = defineEmits(['addRecent'])

const state = reactive({
  msg: '',
  msgList: [],
  myId: '',
  peer: {},
})

const sendVideoDom = ref(null)
const recieveVideoDom = ref(null)
let recieveshow = ref(true)
let tempLocalStream
let tempRemoteStream
let firstRender = ref(false)
let sf = ref(null)
const { handleTime, handleAddTime, compareAddTime } = useTime()
let latsedTime = ref('')
let fileSuffixList = [
  'text/plain',
  'application/pdf',
  'application/x-zip-compressed',
]
const scrollToBottom = () => {
  if (scrollbarRef.value) {
    scrollbarRef.value.setScrollTop(ul.value.scrollHeight)
  }
}

onBeforeMount(async () => {
  username = localStorage.getItem('username')

  firstRender.value = true
  if (!username) {
    router.push('/login')
    return
  }
})
onMounted(() => {
  const peer = new Peer()
  peer.on('open', (id) => {
    state.myId = id
    state.peer = peer
  })
  peer.on('call', (call) => {
    videoshow.value = true
    recieveshow.value = false
    var getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia
    getUserMedia(
      { video: true, audio: true },
      (stream) => {
        sendVideoDom.value.srcObject = stream
        tempLocalStream = stream
        call.answer(stream)
        call.on('stream', (userVideoStream) => {
          recieveVideoDom.value.srcObject = userVideoStream
          tempRemoteStream = userVideoStream
        })
      },
      (err) => {
        console.log('Error!')
      }
    )
  })
})
watch(firstRender, async (n) => {
  if (n) {
    let res = await getSingalHistory({
      sender: username,
      reciver: name.value,
    })
    handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      state.msgList = res.data.result
      let timestr = state.msgList[state.msgList.length - 1]?.time
      latsedTime.value = timestr

      state.msgList.forEach((item) => {
        item.time = handleTime(item.time)
      })
      let scrarr = res.data.result.filter((item) => item.type === 'image')
      srcList.value = scrarr.map((item) => item.msg)
      setTimeout(() => {
        scrollToBottom()
      }, 0)
    }
  }
})
watch(name, async () => {
  let res = await getSingalHistory({ sender: username, reciver: name.value })
  handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.result) {
    state.msgList = res.data.result
    let timestr = state.msgList[state.msgList.length - 1]?.time
    latsedTime.value = timestr
    let scrarr = res.data.result.filter((item) => item.type === 'image')
    srcList.value = scrarr.map((item) => item.msg)
    state.msgList.forEach((item) => {
      item.time = handleTime(item.time)
    })

    setTimeout(() => {
      scrollToBottom()
    }, 0)
  }
})
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g // Emoji 正则表达式

let noti

socket.value.on('$chatmsg', (msg) => {
  const _msgData = JSON.parse(msg)
  state.msgList.push(_msgData)

  setTimeout(() => {
    scrollToBottom()
  }, 1)
})

const handleSendBtnClick = async () => {
  const _msg = state.msg
  if (!_msg.trim().length) {
    ElMessage.error('消息内容不能为空!')
    return
  }
  try {
    let res = await sendSingalMsg({
      msg: state.msg,
      sender: username,
      reciver: name.value,
    })
    handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      let time = res.data.result.time

      socket.value.emit(
        '$chat',
        JSON.stringify({
          id: new Date().getTime(),
          sender: username,
          reciver: name.value,
          time: handleAddTime(latsedTime.value, time),
          msg: state.msg,
          type: 'text',
        })
      )
      if (!compareAddTime(latsedTime.value, time)) {
        latsedTime.value = time
      }
      setTimeout(() => {
        scrollToBottom()
      }, 1)
      emits('addRecent', { name: name.value, username, msg: state.msg })
      state.msg = ''
    }
  } catch (e) {
    console.log(e)
    ElMessage.error('发送失败!')
  }
}

const confuse = ({ sender, reciver }) => {
  socket.value.emit('$confuse', { sender, reciver })
  noti.close()
}
socket.value.on('$handleconfuse', ({ sender, reciver }) => {
  if (sender == username) {
    ElMessage.error('对方已拒绝')
    setTimeout(() => {
      videoshow.value = false
      stopMediaTracks(tempLocalStream)
      recieveshow.value = true
    }, 1500)
  }
})

/**
 *弹出视频通知消息框
 * @param {包含发起者和接收者名称} param0
 */
const open3 = ({ sender, reciver }) => {
  noti = ElNotification({
    title: '视频聊天',
    message: h('p', null, `来自${sender}的视频聊天`, [
      h('p', { style: 'text-align:right' }, [
        h(
          'button',
          {
            style:
              'background-color:#f56c6c;color:#fff;border:none;border-radius:10px;width:42px;height:30px;cursor:pointer',
            onClick: () => confuse({ sender, reciver }),
          },
          '取消'
        ),
        h(
          'button',
          {
            style:
              'background-color:#67c23a;color:#fff;border:none;border-radius:10px;width:42px;height:30px;margin-left:5px;cursor:pointer',
            onClick: () => sendoffer({ sender, reciver }),
          },
          '接受'
        ),
      ]),
    ]),
    type: 'info',
    showClose: false,
    duration: 0,
  })
}
const insertText = (item) => {
  isshow.value = false
  input.value.value = input.value.value + item
  const textWithEmojis = input.value.value.replace(emojiRegex, item) // 将 Emoji 替换为指定的文本
  state.msg = textWithEmojis
  input.value.focus()
}

const handleSendEnterMsg = () => {
  handleSendBtnClick()
  input.value.blur()
}
const handlVideoShow = () => {
  dialogVisible.value = true
}

const callUser = () => {
  socket.value.emit('$videoInvite', { reciver: name.value, sender: username })
}
socket.value.on('$handleInvite', ({ sender, reciver }) => {
  open3({ sender, reciver })
})

/**
 *发起视频连接请求
 * @param {目标peerID} remoteID
 */
const videoCall = (remoteID) => {
  recieveshow.value = false
  var getUserMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia

  getUserMedia(
    { video: true, audio: true },
    (stream) => {
      sendVideoDom.value.srcObject = stream
      tempLocalStream = stream
      const call = state.peer.call(remoteID, stream)
      call.on('stream', (remoteStream) => {
        tempRemoteStream = remoteStream
        recieveVideoDom.value.srcObject = remoteStream
      })
    },
    (err) => {
      console.log('Error!')
    }
  )
}

const sendoffer = async ({ sender, reciver }) => {
  socket.value.emit('getRemoteID', { sender, reciver })
  noti.close()
}

/**
 * 发送自身peerID给发起者
 */
socket.value.on('getRemoteID', ({ sender, reciver }) => {
  videoreciever.value = sender
  socket.value.emit('returnRemoteID', { sender, reciver }, state.myId)
})
/**
 * 接收目的peerID,发起连接
 */
socket.value.on('returnRemoteID', (id) => {
  videoCall(id)
})

const handleConfirm = async () => {
  dialogVisible.value = false
  let res = await getOnlineStatu({ username: name.value })
  handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.result && res.data.result['isOnline'] === 0) {
    ElMessage.error('对方离线')
    return
  }
  videoshow.value = true
  callUser()
}

const stopMediaTracks = (stream) => {
  stream?.getTracks().forEach((track) => {
    track.stop()
  })
  if (stream?.getTracks().length === 0) {
    stream.stop()
  }
}
const handleCloseVideo = () => {
  videoshow.value = false
  stopMediaTracks(tempLocalStream)
  stopMediaTracks(tempRemoteStream)
  recieveshow.value = true
  socket.value.emit('closeVideo', videoreciever.value || name.value)
}
socket.value.on('closeVideo', () => {
  ElMessage.error('对方已挂断')
  videoshow.value = false
  stopMediaTracks(tempLocalStream)
  stopMediaTracks(tempRemoteStream)
  recieveshow.value = true
})

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  sf.value = e.target.files[0]
  if (file.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.readAsArrayBuffer(file)
    reader.onload = async (event) => {
      // 将文件内容转换为二进制数据并发送
      const blob = new Blob([event.target.result])
      const url = URL.createObjectURL(blob)
      emits('addRecent', { name: name.value, username, msg: '[图片]' })
      let formData = new FormData()
      formData.append('imageStore', sf.value)
      let res = await stroageImage({
        data: {
          sender: username,
          reciver: name.value,
          index: srcList.value.length,
        },
        formData,
      })
      handleResThrottle(ElMessage, router, res.data.code, res.data?.msg)
      if (res.data.result) {
        let time = res.data.result.time
        state.msgList.push({
          id: new Date().getTime(),
          sender: username,
          reciver: name.value,
          time: handleAddTime(latsedTime.value, time),
          msg: url,
          type: 'image',
          index: srcList.value.length,
        })
        if (!compareAddTime(latsedTime.value, time)) {
          latsedTime.value = time
        }
        srcList.value.push(url)
        socket.value.emit('sendFile', {
          reciver: name.value,
          sender: username,
          msg: uploadUrl + file.name,
          type: 'image',
          time: handleAddTime(latsedTime.value, time),
        })
        setTimeout(() => {
          scrollToBottom()
        }, 1)
      }
    }
  } else if (fileSuffixList.includes(file.type)) {
    let res = await start(sf.value, username, name.value, file.type)
    let { result } = res
    handleResThrottle(ElMessage, router, res.code, res?.msg)

    state.msgList.push({
      id: new Date().getTime(),
      sender: result.sender,
      reciver: result.reciver,
      time: handleAddTime(latsedTime.value, result.time),
      msg: file.name,
      type: file.type,
      url: result.url,
    })
    if (!compareAddTime(latsedTime.value, result.time)) {
      latsedTime.value = result.time
    }
    socket.value.emit('sendFile', {
      sender: result.sender,
      reciver: result.reciver,
      msg: file.name,
      type: file.type,
      time: handleAddTime(latsedTime.value, result.time),
    })
    setTimeout(() => {
      scrollToBottom()
    }, 1)
  } else {
    return ElMessage.error('仅支持图片,文本,PDF,ZIP格式')
  }
}
socket.value.on(
  'handleSendFile',
  ({ reciver, sender, msg, type, time, url }) => {
    if (reciver === username) {
      if (type.startsWith('image')) {
        state.msgList.push({
          id: new Date().getTime(),
          sender,
          reciver,
          msg,
          index: srcList.value.length,
          time,
          type,
          url,
        })
        srcList.value.push(msg)

        setTimeout(() => {
          scrollToBottom()
        }, 1)
      } else {
        state.msgList.push({
          id: new Date().getTime(),
          sender,
          reciver,
          msg,
          time,
          type,
        })
        setTimeout(() => {
          scrollToBottom()
        }, 1)
      }
    }
  }
)
const handleSendFile = () => {
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.addEventListener('change', handleFileSelect)
  fileInput.click()
}
</script>

<template>
  <el-container class="con">
    <el-header class="header">
      <p>{{ name }}</p>
    </el-header>
    <el-main class="main">
      <el-scrollbar ref="scrollbarRef">
        <ul ref="ul">
          <SingalMsgList
            :avatar="avatar"
            :msgList="state.msgList"
            :username="username"
            :srcList="srcList"
            :otheravatar="otheravatar"
            :name="name"
          />
        </ul>
      </el-scrollbar>
    </el-main>
    <el-footer class="footer">
      <el-row>
        <p class="emoji" @click="isshow = !isshow">&#128512;</p>
        <el-icon class="video" @click="handlVideoShow"><VideoCamera /></el-icon>
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

  <el-dialog v-model="dialogVisible" width="30%" title="视频聊天">
    <span>是否对{{ name }}发起视频聊天?</span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm"> 确认 </el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="videoshow" width="50%" :show-close="false" center>
    <template #default>
      <div class="video-box">
        <div>
          <video id="send-video" autoplay ref="sendVideoDom"></video>
          <p class="video-sender">{{ username }}</p>
        </div>

        <div>
          <video id="recive-video" autoplay ref="recieveVideoDom"></video>
          <p class="video-reciver recieving" v-if="recieveshow">正在接通中</p>
          <p class="video-reciver" v-else>{{ videoreciever || name }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCloseVideo">挂断</el-button>
      </span>
    </template>
  </el-dialog>
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
.emoji {
  font-size: 20px;
  &:hover {
    cursor: pointer;
  }
}

.video-box {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.video {
  font-size: 20px;
  margin-left: 10px;
  margin-top: 7px;
  &:hover {
    cursor: pointer;
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
#send-video {
  width: 240px;
  height: 180px;
}
#recive-video {
  margin-left: 20px;
  width: 240px;
  height: 180px;
}
.video-sender {
  text-align: center;
}
.video-reciver {
  text-align: center;
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

.timebox {
  margin: 0 auto;
  p {
    text-align: center;
    font-size: 12px;
  }
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

@keyframes dot {
  0% {
    content: '...';
  }
  25% {
    content: '';
  }
  50% {
    content: '.';
  }
  75% {
    content: '..';
  }
  100% {
    content: '...';
  }
}
.recieving::after {
  content: '';
  animation: dot 2s infinite;
}
</style>
