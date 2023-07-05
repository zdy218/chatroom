<script setup>
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
let username = ''
let path = ref('')
onBeforeMount(() => {
  username = localStorage.getItem('username')
  path = localStorage.getItem('path') ? localStorage.getItem('path') : '/'
  if (!username) {
    router.push('/login')
    return
  }
})
const changePath = (item) => {
  console.log(item)
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
</script>

<template>
  <div class="menu">
    <el-menu
      :default-active="path"
      class="el-menu-vertical-demo"
      background-color="#545c64"
      @select="changePath"
    >
      <el-menu-item index="/">
        <span>在线聊天室</span>
      </el-menu-item>
      <el-menu-item index="zyc123">
        <span>zyc123</span>
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
</style>
