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
})
let path = reactive({
  path: '',
})
let badge = ref(0)
let pathList = reactive({
  searchList: [],
  list: [''],
  list1: [],
})
let input3 = ref('')
let isshow = ref(false)
let imageUrl = ref('')
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
    pathList.list = ['在线聊天室', ...res.data.result]
    res = await getSelf({ username: user.username })

    user.avatar = res.data.result[0].avatar
  } catch (e) {
    console.log(e)
  }
})
const changePath = async (item) => {
  if (item == localStorage.getItem('path')) {
    return
  } else {
    path.path = `${item}`
    localStorage.setItem('path', item)
    if (item != '/') {
      let res = await getSingalHistory({
        sender: user.username,
        reciver: path.path,
      })
      pathList.list1 = res.data.result
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
  if (name === '' || pathList.list.includes(name)) {
    return
  } else {
    pathList.list.push(name)
  }
  addRecentChat({ username: name, sender: user.username })
}
//通知用户更新最近聊天，对应的用户收到信息通知
socket.on('$addchat', async (msg) => {
  if (msg == user.username) {
    let res = await getRecentChat({ sender: msg })
    pathList.list = ['在线聊天室', ...res.data.result]
  }
})
const handleAddRecentChat = async (name) => {
  socket.emit('$add', name)
}
//通知有新信息
socket.on('$addbadgevalue', async (msg) => {
  const { pth, name } = msg
  if (pth != path.path && name != user.username) {
    badge.value++
  } else {
    return
  }
})
const handleAddChat = () => {
  socket.emit('$addbadge', { pth: path.path, name: user.username })
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
            :index="item == '在线聊天室' ? '/' : item"
            v-for="(item, index) in pathList.list"
            :key="index"
            :class="[
              item == path.path || (path.path == '/' && item == '在线聊天室')
                ? 'active-menu'
                : '',
            ]"
          >
            <p style="margin-left: 3px">{{ item }}</p>
            <p style="margin-right: 5px" v-if="badge > 0">{{ badge }}</p>
          </el-menu-item>
        </el-menu>
      </div>
    </div>
    <ChatBox v-if="path.path == '/'" @addChat="handleAddChat" />
    <SingalBox
      v-else
      :name="path.path"
      @addRecent="handleAddRecentChat"
      :list="pathList.list1"
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
.active-menu {
  background-color: #ccc;
  color: black;
}
.el-menu-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
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
</style>
