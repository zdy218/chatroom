<script setup>
import { reactive, onBeforeMount, ref, toRef, watch, h, onMounted } from 'vue'
import { useScoketIo } from '../hooks'
import {
  getSingalHistory,
  sendSingalMsg,
  addUnreadMsg,
  stroageImage,
} from '../utils/'
// import Video from '../components/Video.vue'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import 'element-plus/theme-chalk/src/message.scss'
import { useRouter } from 'vue-router'
import { VideoCamera, Folder } from '@element-plus/icons-vue'
import { uploadUrl } from '../configs'
// import msgRight from './msgRight.jsx'
const router = useRouter()
const props = defineProps(['name', 'avatar', 'otheruser'])

const name = toRef(props, 'name')
const input = ref(null)
const scrollbarRef = ref(null)
const ul = ref(null)
let username = ''
let isshow = ref(false)
let videoshow = ref(false)
let video = ref(false)
let dialogVisible = ref(false)
const emits = defineEmits(['addRecent'])
const socket = useScoketIo()
const state = reactive({
  msg: '',
  msgList: [],
})
const sendVideoDom = ref(null)
const recieveVideoDom = ref(null)
let recieveshow = ref(true)
let tempLocalStream
let tempRemoteStream
let receivedFile = ref(null)
let sf = ref(null)
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
    let res = await getSingalHistory({ sender: username, reciver: props.name })
    state.msgList = res.data.result
  } catch (e) {
    console.log(e)
  }
  setTimeout(() => {
    scrollToBottom()
  }, 0)
})
watch(name, async () => {
  let res = await getSingalHistory({ sender: username, reciver: name.value })
  state.msgList = res.data.result
  setTimeout(() => {
    scrollToBottom()
  }, 0)
})
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g // Emoji 正则表达式
const rtcConfig = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
}
const localPc = new RTCPeerConnection(rtcConfig)
const remotePc = new RTCPeerConnection(rtcConfig)

let noti

socket.on('$chatmsg', (msg) => {
  const _msgData = JSON.parse(msg)
  state.msgList.push(_msgData)
  // if (_msgData.sender == username && _msgData.reciver == name.value) {
  // }

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

    if (res.data.code == 200) {
      socket.emit(
        '$chat',
        JSON.stringify({
          id: new Date().getTime(),
          sender: username,
          reciver: name.value,
          dateTime: new Date().getTime(),
          msg: state.msg,
        })
      )
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
const onSuccessLocal = async (stream) => {
  // const videoTracks = stream.getVideoTracks()
  //console.log('视频设备: ' + videoTracks[0].label)
  //const audioTracks = stream.getAudioTracks()
  //console.log('音频设备: ' + audioTracks[0].label)
  // 播放轨道获取的流

  sendVideoDom.value.srcObject = stream
  tempLocalStream = stream
  stream.getTracks().forEach((track) => {
    localPc.addTrack(track, stream)
  })

  socket.emit('$videoInvite', { reciver: name.value, sender: username })
}
const onError = (error) => console.log(error)
const sendoffer = async ({ sender, reciver }) => {
  socket.emit('$accept', { sender, reciver })
  if (reciver == username) {
    videoshow.value = true
    const localStream = navigator.mediaDevices.getUserMedia(constraints)

    localStream
      .then((stream) => {
        reciver.value.srcObject = stream
        tempLocalStream = stream
        stream.getTracks().forEach((track) => {
          localPc.addTrack(track, stream)
        })
      })
      .catch((err) => onError(err))
  }
  noti.close()
}
const createPeerConnection = async ({ localPc, sender, reciver }) => {
  let offer = await localPc.createOffer()
  // 保存为本地描述
  await localPc.setLocalDescription(new RTCSessionDescription(offer))

  // 通过信令服务器发送到对端
  socket.emit('offer', { offer, sender, reciver })
}
socket.on('$handleaccept', async ({ sender, reciver }) => {
  if (username == sender) {
    // let offer = await localPc.createOffer()
    // // 保存为本地描述
    // await localPc.setLocalDescription(new RTCSessionDescription(offer))
    // // 通过信令服务器发送到对端
    // socket.emit('offer', { offer, sender, reciver })
    createPeerConnection({ localPc, sender, reciver })
  }
})
const confuse = ({ sender, reciver }) => {
  socket.emit('$confuse', { sender, reciver })
  noti.close()
}
socket.on('$handleconfuse', ({ sender, reciver }) => {
  if (sender == username) {
    ElMessage.error('对方已拒绝')
    setTimeout(() => {
      videoshow.value = false
      stopMediaTracks(tempLocalStream)
      recieveshow.value = true
    }, 1500)
  }
})
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

socket.on('$handleInvite', ({ sender, reciver }) => {
  if (reciver == username) {
    open3({ sender, reciver })
  }
  // const remoteStream = navigator.mediaDevices.getUserMedia(constraints)
  // remoteStream.then(onSuccessRemote).catch(onError)
})

const constraints = {
  audio: true,
  video: true,
}

const handleConfirm = async () => {
  dialogVisible.value = false
  videoshow.value = true // 访问媒体设备
  const localStream = navigator.mediaDevices.getUserMedia(constraints)

  localStream
    .then((stream) => onSuccessLocal(stream))
    .catch((err) => onError(err))
}
socket.on('handleoffer', async ({ offer, sender, reciver }) => {
  if (sender == username && reciver == name.value) {
    await remotePc.setRemoteDescription(offer)
    let remoteAnswer = await remotePc.createAnswer()
    await localPc.setRemoteDescription(remoteAnswer)
    await remotePc.setLocalDescription(remoteAnswer)
  }
})

localPc.onicecandidate = async function (event) {
  // 回调时，将自己candidate发给对方，对方可以直接addIceCandidate(candidate)添加可以获取流

  if (event.candidate) {
    //await remotePc.addIceCandidate(event.candidate)
    socket.emit('candidate', {
      candidate: event.candidate,
      sender: username,
      reciver: name.value,
    })
  }
}

socket.on('handleCandidate', async ({ candidate, sender, reciver }) => {
  await remotePc.addIceCandidate(candidate)
})

remotePc.ontrack = (e) => {
  //bobRemoteMediaStream.addTrack(e.track)
  recieveshow.value = false
  recieveVideoDom.value.srcObject = e.streams[0]
  tempRemoteStream = e.streams[0]

  // socket.emit('$track', {
  //   streams: e.streams[0],
  //   sender: username,
  //   reciver: name.value,
  // })
  // recieveVideoDom.value.oncanplay = () => {
  //   recieveVideoDom.value.play()
  //   console.log(1)
  // }
}

function stopMediaTracks(stream) {
  stream.getTracks().forEach((track) => {
    track.stop()
  })

  if (stream.getTracks().length === 0) {
    stream.stop()
  }
}
const handleCloseVideo = () => {
  videoshow.value = false
  stopMediaTracks(tempLocalStream)
  stopMediaTracks(tempRemoteStream)
  recieveshow.value = true
}

const handleFileSelect = async (e) => {
  const file = e.target.files[0]
  sf.value = e.target.files[0]
  const reader = new FileReader()
  reader.readAsArrayBuffer(file)

  reader.onload = async (event) => {
    // 将文件内容转换为二进制数据并发送
    const blob = new Blob([event.target.result], { type: file.type })
    const data = { file: blob, type: file.type, name: file.name }
    if (file.type.startsWith('image/')) {
      const blob = new Blob([event.target.result])
      const url = URL.createObjectURL(blob)
      state.msgList.push({
        id: new Date().getTime(),
        sender: username,
        reciver: name.value,
        dateTime: new Date().getTime(),
        msg: url,
      })
      setTimeout(() => {
        scrollToBottom()
      }, 1)
      emits('addRecent', { name: name.value, username, msg: '[图片]' })
      let formData = new FormData()

      formData.append('imageStore', sf.value)
      let res = await stroageImage({
        data: { sender: username, reciver: name.value },
        formData,
      })

      socket.emit('sendImageFile', {
        reciver: name.value,
        sender: username,
        msg: uploadUrl + file.name,
        type: file.type,
      })
    }
  }
}
socket.on('handleSendImageFile', ({ reciver, sender, msg, type }) => {
  if (reciver == username) {
    if (type.startsWith('image/')) {
      state.msgList.push({
        id: new Date().getTime(),
        sender,
        reciver,
        dateTime: new Date().getTime(),
        msg,
      })
      setTimeout(() => {
        scrollToBottom()
      }, 1)
    }
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
      <p>{{ name }}</p>
    </el-header>
    <el-main class="main">
      <el-scrollbar ref="scrollbarRef">
        <ul ref="ul">
          <li
            v-for="item in state.msgList"
            :key="item.id"
            :class="[item.sender == username ? 'msgright' : 'msgleft']"
          >
            <div v-if="item.sender == username" class="msg msgright">
              <div class="msgrightbox" style="margin-right: 5px">
                <span class="textuser" style="text-align: right">{{
                  item.sender
                }}</span>
                <span
                  v-if="
                    item.msg.startsWith('blob') || item.msg.startsWith('http')
                  "
                >
                  <img :src="item.msg" style="width: 50%; float: right" />
                </span>
                <span v-else class="textmsg boxright"> {{ item.msg }}</span>
              </div>
              <div class="avatarbox">
                <el-avatar shape="square" fit="fill" :size="30" :src="avatar" />
              </div>
            </div>
            <div v-else class="msg msgleft">
              <div class="avatarbox">
                <el-avatar
                  shape="square"
                  fit="fill"
                  :size="30"
                  :src="otheruser.avatar"
                />
              </div>
              <div class="msgrightbox" style="margin-left: 5px">
                <span class="textuser">{{ name }}</span>
                <span v-if="item.msg.startsWith('http')">
                  <img :src="item.msg" style="width: 50%" />
                </span>
                <span v-else class="textmsg boxleft"> {{ item.msg }}</span>
              </div>
            </div>
          </li>
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

  <el-dialog v-model="videoshow" width="50%">
    <template #default>
      <div class="video-box">
        <div>
          <video id="send-video" autoplay ref="sendVideoDom"></video>
          <p class="video-sender">{{ username }}</p>
        </div>

        <div>
          <video id="recive-video" autoplay ref="recieveVideoDom"></video>
          <p class="video-reciver recieving" v-if="recieveshow">正在接通中</p>
          <p class="video-reciver" v-else>{{ name }}</p>
        </div>
      </div>
    </template>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCloseVideo">取消</el-button>
      </span>
    </template>
  </el-dialog>
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
.el-dialog {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.video-box {
  width: 100%;
  display: flex;
  flex-direction: row;
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
