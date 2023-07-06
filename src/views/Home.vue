<script setup>
import { onBeforeMount, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Search } from '@element-plus/icons-vue'
import { searchUser } from '../utils'
import { ElMessage } from 'element-plus'
import 'element-plus/theme-chalk/src/message.scss'

const router = useRouter()
let username = ''
let path = ref('')
let pathList = reactive({
  searchList: [],
  list: ['在线聊天室'],
})
let input3 = ref('')
let isshow = ref(false)
onBeforeMount(() => {
  username = localStorage.getItem('username')
  path = localStorage.getItem('path') ? localStorage.getItem('path') : '/'
  if (!username) {
    router.push('/login')
    return
  }
})
const changePath = (item) => {
  if (item == localStorage.getItem('path')) {
    return
  } else {
    if (item == '/') {
      router.push({ path: '/' })
    } else {
      router.push({ path: '/home/singal', query: { name: item } })
    }
    localStorage.setItem('path', item)
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
    // console.log(res.data.result)
    // console.log(typeof arr)
  } catch (err) {
    ElMessage.error('搜索失败')
    console.log(err)
  }
}
const handleAddFriend = (name = '') => {
  isshow.value = false
  input3.value = ''
  if (name == '') {
    return
  }
  pathList.list.push(name)
}
</script>

<template>
  <div class="menu">
    <el-menu
      :default-active="path"
      class="el-menu-vertical-demo"
      background-color="#545c64"
      @select="changePath"
      active-text-color="#ffd04b"
      text-color="white"
    >
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
      <!-- <el-menu-item index="/">
        <span style="margin-left: 5px">在线聊天室</span>
      </el-menu-item> -->

      <el-menu-item
        :index="item == '在线聊天室' ? '/' : item"
        v-for="(item, index) in pathList.list"
        :key="index"
      >
        <span style="margin-left: 3px">{{ item }}</span>
      </el-menu-item>
    </el-menu>
    <RouterView />
  </div>
</template>
<style lang="scss" scoped>
.menu {
  display: flex;
  flex-direction: row;
  justify-content: center;
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
</style>
