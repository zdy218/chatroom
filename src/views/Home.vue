<script setup>
import { onBeforeMount, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import {
  searchUser,
  getRecentChat,
  addRecentChat,
  getSingalHistory,
  getSelf,
  getAvatarList,
  updateUnreadMsgNum,
  getAllUnreadMsg,
  readMsg,
  addUnreadMsg,
  getLastedMsg,
  getOnlineLastedMsg,
} from '../utils'
import { ElMessage } from 'element-plus'
import ChatBox from '../components/ChatBox.vue'
import SingalBox from '../components/SingalBox.vue'
import 'element-plus/theme-chalk/src/message.scss'
import { useScoketIo } from '../hooks'
import { Plus } from '@element-plus/icons-vue'
const router = useRouter()
const socket = useScoketIo()
let fit = 'space-scale'
let user = reactive({
  username: '',
  avatar: '',
  avatarlist: [],
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
let lastedMsg = reactive({
  user: '',
  msg: '',
})
onBeforeMount(async () => {
  user.username = localStorage.getItem('username')
  path.path = localStorage.getItem('path') ? localStorage.getItem('path') : '/'
  if (!user.username) {
    router.push('/login')
    return
  }
  try {
    //通过当前用户去查询最近聊天
    let res = await getRecentChat({ sender: user.username })
    pathList.list = [{ username: '在线聊天室' }, ...res.data.result]

    //获取自身头像
    res = await getSelf({ username: user.username })
    user.avatar = res.data.result[0].avatar
    if (path.path != '/') {
      otheruser = pathList.list.find((t) => {
        if (t.username == path.path) {
          return t
        }
      })
    }
    //获取用户头像
    res = await getAvatarList()
    user.avatarlist = res.data.result

    //获取所有未读聊天信息数目
    res = await getAllUnreadMsg({ username: user.username })
    let { result } = res.data
    pathList.list.forEach((item) => {
      result.forEach((obj) => {
        if (item.username == obj.sender) {
          item.badge = obj.unreadnum
        }
      })
    })
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
      let row = res.data.result.rows[0]
      pathList.list.find(
        (item) => item.username == row.sender || item.username == row.reciver
      ).recentMsg = row.msg
    })

    //获取聊天室最近一条消息
    res = await getOnlineLastedMsg()
    lastedMsg.user = res.data.result.rows[0].user
    lastedMsg.msg = res.data.result.rows[0].msg
  } catch (e) {
    console.log(e)
  }
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
      // let res = await getSingalHistory({
      //   sender: user.username,
      //   reciver: path.path,
      // })
      // res = await getAllUnreadMsg({ username: user.username })
      // let { result } = res.data
      // pathList.list.forEach((t) => {
      //   result.forEach((obj) => {
      //     if (t.username === obj.sender) {
      //       t.badge = obj.unreadnum
      //     }
      //   })
      // })

      pathList.list.forEach((t) => {
        if (t.username === item && t.badge > 0) {
          t.badge = 0
          readMsg({ sender: item, username: user.username })
        }
      })

      //获取最近聊天记录
      // let arr = pathList.list.map((item) => item.username).splice(1)
      // arr.forEach(async (t) => {
      //   res = await getLastedMsg({ arr: [t, user.username] })
      //   let row = res.data.result.rows[0]
      //   pathList.list.find(
      //     (item) => item.username == row.sender || item.username == row.reciver
      //   ).recentMsg = row.msg
      // })
      // otheruser.username = item
      otheruser.avatar = findAvatar(item)
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
    pathList.searchList = res.data.result
    isshow.value = true
  } catch (err) {
    ElMessage.error('搜索失败')
    console.log(err)
  }
}
const handleAddFriend = (name = '') => {
  isshow.value = false
  input3.value = ''
  if (name === '' || pathList.list.find((t) => t.username == name)) {
    return
  } else {
    let { avatar } = user.avatarlist.find((t) => t.username == name)
    pathList.list.push({ username: name, avatar })
  }
  addRecentChat({ username: name, sender: user.username })
}
//通知用户更新最近聊天，对应的用户收到信息通知
socket.on('$addchat', async ({ name, username, msg }) => {
  //更新最近聊天记录
  pathList.list.find((item) =>
    [name, username].includes(item.username)
  ).recentMsg = msg
  if (path.path == username) {
    readMsg({ sender: username, username: name })
    return
  }
  if (name == user.username) {
    //addUnreadMsg({ sender: username, username: name })
    // let res = await getRecentChat({ sender: name })
    // pathList.list = [{ username: '在线聊天室' }, ...res.data.result]
    let res = await updateUnreadMsgNum({ sender: username, username: name })
    const obj = res.data.result[0]
    pathList.list.find((item) => item.username == obj.sender).badge =
      obj.unreadnum
    // //获取最近聊天记录
    // let arr = pathList.list.map((item) => item.username).splice(1)
    // arr.forEach(async (t) => {
    //   res = await getLastedMsg({ arr: [t, user.username] })
    //   let row = res.data.result.rows[0]
    //   pathList.list.find(
    //     (item) => item.username == row.sender || item.username == row.reciver
    //   ).recentMsg = row.msg
    // })
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
  if (rawFile.type !== 'image/jpeg') {
    ElMessage.error('Avatar picture must be JPG format!')
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
  return user.avatarlist.find((t) => t.username == item).avatar
}
</script>

<template>
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
        <p>{{ user.username }}</p>
      </div>
    </div>
    <div class="middle">
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
        <div class="searchresult" v-if="isshow">
          <el-scrollbar>
            <p
              v-if="pathList.searchList.length > 0"
              v-for="(item, index) in pathList.searchList"
              :key="index"
              @click="handleAddFriend(item)"
            >
              <el-avatar
                shape="square"
                :fit="fit"
                :size="40"
                :src="findAvatar(item)"
              />
              {{ item }}
            </p>
            <p v-else @click="handleAddFriend()">暂无该用户</p>
          </el-scrollbar>
        </div>
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
                {{ item.recentMsg }}
              </p>
              <p v-else style="margin-top: 5px; margin-left: 3px">
                {{ lastedMsg.user }}:{{ lastedMsg.msg }}
              </p>
            </div>

            <p v-show="item.badge" class="badge">
              {{ item.badge }}
            </p>
          </el-menu-item>
        </el-menu>
      </div>
    </div>
    <ChatBox v-if="path.path == '/'" @addChat="handleAddChat" />
    <SingalBox
      v-else
      :name="path.path"
      @addRecent="handleAddRecentChat"
      :avatar="user.avatar"
      :otheruser="otheruser"
    />
  </div>
</template>
<style lang="scss" scoped>
.menu {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
.user {
  background-color: #2d2736;
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
  .ul {
    background-color: #e6e6e6;
    height: 89%;
    .el-menu {
      background-color: #e6e6e6;
    }
  }
}
.searchbox {
  width: 80%;
  margin: 10px auto;
  position: relative;
  z-index: 1;
  background-color: white;
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
    p {
      text-align: center;
      padding: 3px;
      background-color: antiquewhite;
      &:hover {
        cursor: pointer;
      }
    }
  }
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
</style>
