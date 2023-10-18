<script setup>
import {
  onBeforeMount,
  ref,
  reactive,
  onBeforeUnmount,
  onMounted,
  computed,
} from 'vue'
import { useRouter } from 'vue-router'
import {
  Search,
  User,
  UserFilled,
  ChatRound,
  ChatLineRound,
  ArrowRight,
  Plus,
  SwitchButton,
} from '@element-plus/icons-vue'
import {
  searchUser,
  getRecentChat,
  addRecentChat,
  getSelfAvatar,
  getAvatarList,
  updateUnreadMsgNum,
  getAllUnreadMsg,
  readMsg,
  getLastedMsg,
  getOnlineLastedMsg,
  updateOnlineStatus,
  getOnlineStatu,
  getFriendList,
  addFriend,
  changeStatusAndHandle,
} from '../utils'
import { ElMessage } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'
import ChatBox from '../components/ChatBox.vue'
import SingalBox from '../components/SingalBox.vue'
import PersonInfo from '../components/personInfo.vue'
import 'element-plus/theme-chalk/src/message.scss'
import { useScoketIo, useHandleRes, useThrottle } from '../hooks'

const router = useRouter()
const socket = useScoketIo()
const { handelRes } = useHandleRes()
const { throttle } = useThrottle()
const handelThrottle = throttle(handelRes, 50)
let menupath = ref('msg')
let fit = 'space-scale'
let user = reactive({
  username: '',
  avatar: '',
  avatarlist: [],
  friendList: [],
})
let path = reactive({
  path: '',
})
let pathList = reactive({
  searchList: [],
  list: [],
  list1: [],
})
let input3 = ref('')

let isshow = ref(false)
let otheruser = reactive({
  username: '',
  avatar: '',
})
let otheravatar = ref('')
let lastedMsg = reactive({
  user: '',
  msg: '',
})
let friendIndex = ref(0)
let friendInfo = reactive({
  username: '',
  avatar: '',
  status: 0,
})
let loading = ref(true)
let unReadFriendNotification = computed(() => {
  return user.friendList.filter(
    (t) => t.handle === 0 && t.sender != user.username
  ).length
})

onBeforeMount(async () => {
  user.username = localStorage.getItem('username')
  socket.emit('username', user.username)
  let res = await getOnlineStatu({ username: user.username })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  let status = res.data.result ? res.data.result.isOnline : null
  if (status === 0) {
    let res = await updateOnlineStatus({ username: user.username, status: 1 })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  }

  path.path = localStorage.getItem('path') ? localStorage.getItem('path') : '/'
  if (!user.username) {
    router.push('/login')
    return
  }
  try {
    //通过当前用户去查询最近聊天
    let res = await getRecentChat({ sender: user.username })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      pathList.list = [{ username: '在线聊天室' }, ...res.data.result]
    }
    //获取自身头像
    res = await getSelfAvatar({ username: user.username })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    user.avatar = res.data.result ? res.data.result[0].avatar : null
    if (path.path != '/') {
      otheruser = pathList.list.find((t) => {
        if (t.username == path.path) {
          return t
        }
      })
    }
    //获取用户头像
    res = await getAvatarList()
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      user.avatarlist = res.data.result
      if (path.path != '/') {
        otheravatar.value = findAvatar(path.path)
      }
    }

    //更改在线状态

    //获取所有未读聊天信息数目
    res = await getAllUnreadMsg({ username: user.username })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result) {
      let result = res.data.result
      pathList.list.forEach((item) => {
        result.forEach((obj) => {
          if (item.username == obj.sender) {
            item.badge = obj.unreadnum
          }
        })
      })
    }

    //已读当前用户的消息
    pathList.list.forEach((t) => {
      if (t.username === path.path && t.badge > 0) {
        t.badge = 0
        readMsg({ sender: t.username, username: user.username })
      }
    })
    //获取最近聊天记录
    let arr = pathList.list.map((item) => item.username).splice(1)
    arr.forEach(async (t) => {
      res = await getLastedMsg({ arr: [t, user.username] })
      handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
      let row = res.data.result ? res.data.result.rows[0] : null
      pathList.list.find(
        (item) => item.username == row.sender || item.username == row.reciver
      ).recentMsg = row.msg.startsWith('http') ? '[图片]' : row.msg
    })

    //获取聊天室最近一条消息
    res = await getOnlineLastedMsg()
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    lastedMsg.user = res.data.result ? res.data.result.rows[0].user : null
    lastedMsg.msg = res.data.result
      ? res.data.result.rows[0].msg.startsWith('http')
        ? '[图片]'
        : res.data.result.rows[0].msg
      : null
    res = await getFriendList({ username: user.username })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result && res.data.result.length > 0) {
      user.friendList = res.data.result
    }
    loading.value = false
  } catch (e) {
    console.log(e)
  }
})
const handleShowOut = () => {
  if (isshow.value) {
    isshow.value = false
  }
}
onMounted(() => {
  document.body.addEventListener('click', handleShowOut, false)
})
onBeforeUnmount(() => {
  document.body.removeEventListener('click', handleShowOut)
})
const changePath = async (item) => {
  if (item == localStorage.getItem('path')) {
    return
  } else {
    path.path = item
    localStorage.setItem('path', item)
    if (item == '/') {
      return
    } else {
      pathList.list.forEach((t) => {
        if (t.username === item && t.badge > 0) {
          t.badge = 0
          readMsg({ sender: item, username: user.username })
        }
      })
      otheravatar.value = findAvatar(item)
    }
  }
}
const handleSearch = async () => {
  if (!input3.value.trim().length) {
    ElMessage.warning('请输入搜索的用户!')
    return
  }
  try {
    let res = await searchUser({ username: input3.value })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    pathList.searchList = res.data.result ? res.data.result : null
    isshow.value = true
  } catch (err) {
    ElMessage.error('搜索失败')
    console.log(err)
  }
}
const handleAddFriend = async (name = '') => {
  isshow.value = false
  input3.value = ''
  if (
    name === '' ||
    pathList.list.find((t) => t.username === name) ||
    name === user.username
  ) {
    return
  } else {
    let { avatar } = user.avatarlist.find((t) => t.username == name)
    pathList.list.push({ username: name, avatar })
  }
  let res = await addRecentChat({ username, sender: user.username })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
}
const handleAdd = (name = '') => {
  isshow.value = false
  input3.value = ''
  if (name === '') {
    return
  } else {
    friendInfo.username = name
    friendInfo.avatar = findAvatar(name)
    let info = user.friendList.find((t) => t.friendname == name)
    if (info) {
      friendInfo.status = info.status
    } else {
      friendInfo.status = 0
    }
  }
}
//通知用户更新最近聊天，对应的用户收到信息通知
socket.on('$addchat', async ({ name, username, msg }) => {
  //更新最近聊天记录
  pathList.list.find((item) =>
    [name, username].includes(item.username)
  ).recentMsg = msg
  if (path.path == username) {
    let res = await readMsg({ sender: username, username: name })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    return
  }
  if (name === user.username) {
    let res = await updateUnreadMsgNum({ sender: username, username: name })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    const obj = res.data.result ? res.data.result[0] : null
    if (obj) {
      pathList.list.find((item) => item.username == obj.sender).badge =
        obj.unreadnum
    }
  }
})
const handleAddRecentChat = ({ name, username, msg }) => {
  socket.emit('$add', { name, username, msg })
  pathList.list.find((item) => item.username == name).recentMsg = msg
}
//通知有新信息
socket.on('$updateLastedMsg', async ({ msg, user }) => {
  lastedMsg.user = user
  lastedMsg.msg = msg
})
const handleAddChat = ({ msg, user }) => {
  lastedMsg.user = user
  lastedMsg.msg = msg
  socket.emit('$updateLasted', { msg, user })
}
const handleAvatarSuccess = (response, uploadFile) => {
  ElMessage.success('修改成功!')
}

const beforeAvatarUpload = (rawFile) => {
  console.log(rawFile)
  if (rawFile.type !== 'image/png') {
    ElMessage.error('Avatar picture must be  PNG format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }
  const reader = new FileReader()
  reader.readAsDataURL(rawFile)
  reader.onload = (e) => {
    user.avatar = e.target.result
  }
  return true
}
//对应用户头像
const findAvatar = (item) => {
  return user.avatarlist.find((t) => t.username === item)?.avatar
}
const logout = async () => {
  let res = await updateOnlineStatus({ username: user.username, status: 0 })
  localStorage.removeItem('username')
  localStorage.removeItem('token')
  router.push('/login')
}

const handleSendFriendMsg = async (username) => {
  menupath.value = 'msg'
  if (!pathList.list.find((t) => t.username === username)) {
    pathList.list.push({
      username: username,
      avatar: findAvatar(username),
      recentMsg: '',
    })
  }
  let res = await addRecentChat({ username, sender: user.username })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (path.path === username) {
    return
  } else {
    localStorage.setItem('path', username)
    path.path = username
  }
}
const changeToFriend = () => {
  let friendlist = user.friendList.filter((t) => t.status === 1)
  if (friendlist.length > 0) {
    friendInfo.username = friendlist[0].friendname
    friendInfo.avatar = findAvatar(friendInfo.username)
    friendInfo.status = friendlist[0].status
  }
  menupath.value = 'friend'
}
const handleAddToFriend = async (username) => {
  let res = await addFriend({ username: user.username, friendname: username })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.result) {
    let res = await getFriendList({ username: user.username })
    handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
    if (res.data.result && res.data.result.length > 0) {
      user.friendList = res.data.result
      friendInfo.username = res.data.result[0].friendname
      friendInfo.avatar = findAvatar(res.data.result[0].friendname)
      friendInfo.status = res.data.result[0].status
    }
    socket.emit('handleAddToFriend', { username })
  }
}
socket.on('handleAddToFriend', async ({ username }) => {
  ElMessage.info('你收到一条好友申请')
  let res = await getFriendList({ username })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.result && res.data.result.length > 0) {
    user.friendList = res.data.result
    friendInfo.username = res.data.result[0].friendname
    friendInfo.avatar = findAvatar(res.data.result[0].friendname)
    friendInfo.status = res.data.result[0].status
  }
})
const handleConfuse = async (username, sender) => {
  let res = await changeStatusAndHandle({ username, sender, status: -1 })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.code === 200) {
    user.friendList.find(
      (t) => t.username === username && t.sender === sender
    ).status = -1
    user.friendList.find(
      (t) => t.username === username && t.sender === sender
    ).handle = 1
    ElMessage.error('已拒绝对方好友申请')
    socket.emit('confuseAdd', { username, sender, status: -1 })
  }
}

const handleAgree = async (username, sender) => {
  let res = await changeStatusAndHandle({ username, sender, status: 1 })
  handelThrottle(ElMessage, router, res.data.code, res.data?.msg)
  if (res.data.code === 200) {
    user.friendList.find(
      (t) => t.username === username && t.sender === sender
    ).status = 1
    user.friendList.find(
      (t) => t.username === username && t.sender === sender
    ).handle = 1

    if (user.friendList.filter((t) => t.status === 1).length === 1) {
      friendInfo.username = user.friendList[0].friendname
      friendInfo.avatar = findAvatar(user.friendList[0].friendname)
      friendInfo.status = user.friendList[0].status
    }
    ElMessage.success('已同意对方好友申请')
    socket.emit('agreeAdd', { username, sender, status: 1 })
  }
}
const changeMenuItem = (friendname) => {
  friendInfo.username = friendname
  friendInfo.avatar = findAvatar(friendname)
  friendInfo.status = 1
}
socket.on('handleAdd', ({ username, sender, status }) => {
  status === 1
    ? ElMessage.success('对方已同意好友申请')
    : ElMessage.error('对方已拒绝好友申请')
  user.friendList.find(
    (t) => t.username === sender && t.friendname === username
  ).status = status
  user.friendList.find(
    (t) => t.username === sender && t.friendname === username
  ).handle = 1
})
</script>

<template>
  <el-skeleton
    style="width: 805px; height: 400px; background-color: white"
    :loading="loading"
    animated
    :throttle="800"
  >
    <template #template>
      <el-skeleton-item variant="rect" style="width: 805px; height: 240px" />
      <div style="padding: 14px">
        <el-skeleton-item variant="h3" style="width: 50%" />
        <div
          style="
            display: flex;
            align-items: center;
            justify-items: space-between;
            margin-top: 16px;
            height: 16px;
          "
        >
          <el-skeleton-item variant="text" style="margin-right: 16px" />
          <el-skeleton-item variant="text" style="width: 30%" />
        </div>
      </div>
    </template>
    <template #default>
      <div class="menu">
        <div class="user">
          <div class="block">
            <el-upload
              class="avatar-uploader"
              name="avatar"
              action="http://127.0.0.1:3000/user/update/avatar"
              :data="{ username: user.username }"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
            >
              <el-avatar
                v-if="user.avatar"
                shape="square"
                :fit="fit"
                :size="40"
                :src="user.avatar"
              />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>

            <p style="cursor: pointer">
              {{ user.username }}
            </p>
          </div>
          <div class="msglist">
            <el-icon v-if="menupath === 'msg'" color="white" size="25"
              ><ChatLineRound
            /></el-icon>
            <el-icon v-else color="white" size="25" @click="menupath = 'msg'"
              ><ChatRound
            /></el-icon>
          </div>

          <div class="friend">
            <el-icon v-if="menupath === 'friend'" color="white" size="25"
              ><UserFilled
            /></el-icon>
            <el-icon v-else color="white" size="25" @click="changeToFriend"
              ><User
            /></el-icon>
          </div>
          <div class="logout" @click="logout">
            <el-icon color="white">
              <SwitchButton />
            </el-icon>
            <p style="color: white">退出</p>
          </div>
        </div>
        <div class="middle" v-if="menupath === 'msg'">
          <div class="searchbox">
            <el-input
              v-model="input3"
              placeholder="请搜索用户"
              class="input-with-select"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>
            <Transition name="search">
              <div class="searchresult" v-if="isshow">
                <el-scrollbar>
                  <p
                    v-show="pathList.searchList.length > 0"
                    v-for="(item, index) in pathList.searchList"
                    :key="index"
                    @click="handleAddFriend(item)"
                    class="searchitem"
                  >
                    <el-avatar
                      shape="square"
                      :fit="fit"
                      :size="40"
                      :src="findAvatar(item)"
                    />
                    <span>{{ item }}</span>
                  </p>
                  <p
                    class="noresult"
                    v-show="pathList.searchList.length === 0"
                    @click="handleAddFriend()"
                  >
                    暂无该用户
                  </p>
                </el-scrollbar>
              </div>
            </Transition>
          </div>
          <div class="ul">
            <el-menu
              :default-active="path.path"
              class="el-menu-vertical-demo"
              @select="changePath"
              active-text-color="#ffd04b"
              text-color="black"
            >
              <el-menu-item
                :index="item.username == '在线聊天室' ? '/' : item.username"
                v-for="(item, index) in pathList.list"
                :key="index"
                :class="[
                  item.username == path.path ||
                  (path.path == '/' && item.username == '在线聊天室')
                    ? 'active-menu'
                    : '',
                ]"
              >
                <el-avatar
                  v-if="item.username != '在线聊天室'"
                  shape="square"
                  :fit="fit"
                  :size="40"
                  :src="item.avatar"
                />
                <div>
                  <p style="margin-left: 3px" class="centerbox">
                    {{ item.username }}
                  </p>
                  <p
                    v-if="item.username != '在线聊天室'"
                    style="margin-top: 5px; margin-left: 3px"
                  >
                    <el-text truncated>{{ item.recentMsg }}</el-text>
                  </p>
                  <p v-else style="margin-top: 5px; margin-left: 3px">
                    {{ lastedMsg.user }}:<el-text truncated>{{
                      lastedMsg.msg
                    }}</el-text>
                  </p>
                </div>

                <p v-show="item.badge" class="badge">
                  {{ item.badge }}
                </p>
              </el-menu-item>
            </el-menu>
          </div>
        </div>

        <div class="middle" v-else-if="menupath === 'friend'">
          <div class="searchbox">
            <el-input
              v-model="input3"
              placeholder="请搜索用户"
              class="input-with-select"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch" />
              </template>
            </el-input>
            <Transition name="search">
              <div class="searchresult" v-if="isshow">
                <el-scrollbar>
                  <p
                    v-show="pathList.searchList.length > 0"
                    v-for="(item, index) in pathList.searchList"
                    :key="index"
                    @click="handleAdd(item)"
                    class="searchitem"
                  >
                    <el-avatar
                      shape="square"
                      :fit="fit"
                      :size="40"
                      :src="findAvatar(item)"
                    />
                    <span>{{ item }}</span>
                  </p>
                  <p class="noresult" v-show="pathList.searchList.length === 0">
                    暂无该用户
                  </p>
                </el-scrollbar>
              </div>
            </Transition>
          </div>
          <div class="friendul">
            <el-popover
              placement="right"
              title="好友申请"
              :width="210"
              trigger="hover"
            >
              <template #reference>
                <div class="noti">
                  <el-badge
                    :value="unReadFriendNotification"
                    class="item"
                    :hidden="!unReadFriendNotification"
                  >
                    <p>通知</p>
                  </el-badge>
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </template>
              <template #default>
                <div>
                  <p
                    v-for="item in user.friendList"
                    :key="item.id"
                    class="notification"
                  >
                    {{ item.friendname }}
                    <el-button
                      disabled
                      v-if="item.status != 0 && item.handle === 1"
                    >
                      {{ item.status === 1 ? '已同意' : '已拒绝' }}
                    </el-button>
                    <el-button
                      v-if="
                        item.status === 0 &&
                        item.handle === 0 &&
                        item.sender != user.username
                      "
                      type="danger"
                      @click="handleConfuse(user.username, item.sender)"
                      >拒绝
                    </el-button>
                    <el-button
                      v-if="
                        item.status === 0 &&
                        item.handle === 0 &&
                        item.sender != user.username
                      "
                      type="success"
                      @click="handleAgree(user.username, item.sender)"
                      >同意
                    </el-button>
                    <el-button
                      v-if="
                        item.status === 0 &&
                        item.handle === 0 &&
                        item.sender === user.username
                      "
                      disabled
                      >待通过
                    </el-button>
                  </p>
                </div>
              </template>
            </el-popover>
            <p style="text-align: center">好友列表</p>
            <el-scrollbar>
              <el-menu
                class="el-menu-vertical-demo"
                active-color="#000"
                text-color="black"
                :default-active="friendIndex + ''"
              >
                <el-menu-item
                  v-for="(item, index) in user.friendList"
                  :key="index"
                  :index="index + ''"
                  v-show="item.status"
                  @click="changeMenuItem(item.friendname)"
                >
                  <el-avatar
                    shape="square"
                    :fit="fit"
                    :size="40"
                    :src="findAvatar(item.friendname)"
                  />
                  <div>
                    <p style="margin-left: 5px; color: black">
                      {{ item.friendname }}
                    </p>
                  </div>
                </el-menu-item>
              </el-menu>
            </el-scrollbar>
          </div>
        </div>
        <div class="aside" v-if="menupath === 'msg'">
          <ChatBox v-if="path.path === '/'" @addChat="handleAddChat" />
          <SingalBox
            v-else
            :name="path.path"
            @addRecent="handleAddRecentChat"
            :avatar="user.avatar"
            :otheravatar="otheravatar"
            :otheruser="otheruser"
            :socket="socket"
          />
        </div>
        <el-container
          class="infoBox"
          v-else
          style="
            width: 500px;
            min-width: 300px;
            background-color: white;
            height: 472px;
          "
        >
          <PersonInfo
            :username="friendInfo.username"
            :avatar="friendInfo.avatar"
            :status="friendInfo.status"
            :friendList="user.friendList"
            @send="handleSendFriendMsg"
            @addFriend="handleAddToFriend"
          />
        </el-container></div
    ></template>
  </el-skeleton>
</template>
<style lang="scss" scoped>
.menu {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.user {
  background-color: #2d2736;
  border-radius: 10px 0 0 10px;
  .block {
    padding: 30px 8px;
    p {
      color: white;
    }
  }
}
.middle {
  border-top: 1px #ccc solid;
  border-bottom: 1px solid #ccc;
  background-color: white;
  .ul {
    background-color: #e6e6e6;
    height: 89%;
    .el-menu {
      background-color: #e6e6e6;
    }
    .el-text {
      width: 90px;
      color: black;
    }
  }
  .friendul {
    height: 89%;
    margin-top: 25px;
    .el-menu {
      .el-menu-item {
        border: none;
        display: flex;
        flex-direction: row;
        align-items: center;
      }
    }
  }
}
.searchbox {
  width: 80%;
  margin: 10px auto;
  position: relative;
  z-index: 1;

  .input-with-select .el-input-group__prepend {
    background-color: var(--el-fill-color-blank);
  }
  .searchresult {
    position: absolute;
    background-color: white;
    width: 100%;
    top: 30px;
    max-height: 100px;
    border-radius: 5px;
    border: 1px antiquewhite solid;
    .searchitem {
      text-align: center;
      padding: 3px;
      background-color: white;
      &:hover {
        cursor: pointer;
        background-color: #e6e6e6;
      }
      display: flex;
      flex-direction: row;
      align-items: center;
      span {
        padding-left: 15px;
      }
    }
    .noresult {
      text-align: center;
      padding: 5px;
    }
  }
}
.search-enter-active {
  transition: all 0.3s ease-out;
}

.search-leave-active {
  transition: all 0.3s ease-out;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
.centerbox {
  height: 20px;
}
.active-menu {
  background-color: #ccc;
  color: black;
}
.el-menu-item {
  display: flex;
  flex-direction: row;
}

.avatar-uploader-icon {
  margin-left: 8px;
  font-size: 28px;
  color: #8c939d;
  // width: 178px;
  // height: 178px;
  text-align: center;
  background-color: white;
}
.el-avatar {
  margin-left: 3px;
}
.badge {
  margin-left: 85px;
  border: none;
  width: 22px;
  line-height: 17px;
  padding: 3px;
  background-color: #eb0707d4;
  color: wheat;
  border-radius: 100%;
  text-align: center;
}
.msglist {
  text-align: center;
  margin-top: 10px;
  cursor: pointer;
}
.friend {
  text-align: center;
  margin-top: 25px;
  cursor: pointer;
}
.infoBox {
  display: flex;
  align-items: center;
  justify-content: center;
}
.logout {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 185px;
  cursor: pointer;
}
.noti {
  display: flex;
  height: 30px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  p {
    margin-left: 22px;
  }
  .el-icon {
    margin-right: 10px;
  }
  &:hover {
    background-color: #ccc;
  }
}
.notification {
  margin-top: 3px;
  height: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
