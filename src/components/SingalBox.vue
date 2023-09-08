<script setup>
import { reactive, onBeforeMount, ref, toRef, watch } from 'vue'
import { useScoketIo } from '../hooks'
import { getSingalHistory, sendSingalMsg, addUnreadMsg } from '../utils/'
// import Video from '../components/Video.vue'
import { ElMessage } from 'element-plus'
import Emoji from './emoji.vue'
import 'element-plus/theme-chalk/src/message.scss'
import { useRouter } from 'vue-router'
import { VideoCamera } from '@element-plus/icons-vue'

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

let tempLocalStream
let tempRemoteStream
var amyRemoteMediaStream = new MediaStream()
var bobRemoteMediaStream = new MediaStream()
let str = null
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
const open3 = () => {
  ElNotification({
    title: 'Info',
    message: 'This is an info message',
    type: 'info',
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
const onSuccessLocal = async (stream) => {
  // const videoTracks = stream.getVideoTracks()
  //console.log('视频设备: ' + videoTracks[0].label)
  //const audioTracks = stream.getAudioTracks()
  //console.log('音频设备: ' + audioTracks[0].label)
  // 播放轨道获取的流

  sendVideoDom.value.srcObject = stream
  tempLocalStream = stream
  socket.emit('$videoInvite', name.value)
  stream.getTracks().forEach((track) => {
    localPc.addTrack(track, stream)
  })
  let offer = await localPc.createOffer()
  // 保存为本地描述
  await localPc.setLocalDescription(new RTCSessionDescription(offer))

  // 通过信令服务器发送到对端
  socket.emit('offer', offer)
}
socket.on('$handleInvite', (name) => {
  if (name == username) {
    open3()
  }
  // const remoteStream = navigator.mediaDevices.getUserMedia(constraints)
  // remoteStream.then(onSuccessRemote).catch(onError)
})
// const onSuccessRemote = (stream) => {
//   reviveVideoDom.value.srcObject = stream
//   tempRemoteStream = stream
// }
const onError = (error) => console.log(error)

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
socket.on('handleoffer', async (offer) => {
  await remotePc.setRemoteDescription(offer)
  let remoteAnswer = await remotePc.createAnswer()

  await localPc.setRemoteDescription(remoteAnswer)

  socket.emit('answer', remoteAnswer)
})
socket.on('handleanswer', async (answer) => {
  // 将 Answer 保存为远程描述；
  // let remotePc = new RTCPeerConnection()

  await remotePc.setLocalDescription(answer)
})
localPc.onicecandidate = async function (event) {
  // 回调时，将自己candidate发给对方，对方可以直接addIceCandidate(candidate)添加可以获取流

  if (event.candidate) {
    //await remotePc.addIceCandidate(event.candidate)
    socket.emit('candidate', event.candidate)
  }
}

socket.on('handleCandidate', async (candidate) => {
  await remotePc.addIceCandidate(candidate)
})
// remotePc.onicecandidate = function (event) {
//   if (event.candidate) {
//     localPc.addIceCandidate(event.candidate)
//   }
// }
remotePc.ontrack = (e) => {
  console.log(e.streams[0])
  //bobRemoteMediaStream.addTrack(e.track)
  recieveVideoDom.value.srcObject = e.streams[0]
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
  //stopMediaTracks(tempRemoteStream)
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
                <span class="textmsg boxright"> {{ item.msg }}</span>
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
        <el-icon class="video" @click="handlVideoShow"><VideoCamera /></el-icon>
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
          <p class="video-reciver">{{ name }}</p>
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
#send-video {
  width: 90%;
}
#recive-video {
  width: 90%;
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
</style>
