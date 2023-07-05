<script setup>
import { onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import ChatBox from '../components/ChatBox.vue'
const router = useRouter()
let username = ''
onBeforeMount(() => {
  username = localStorage.getItem('username')
  if (!username) {
    router.push('/login')
    return
  }
})
</script>

<template>
  <div class="menu">
    <el-menu
      default-active="/"
      class="el-menu-vertical-demo"
      background-color="#545c64"
      router
    >
      <el-menu-item index="/">
        <span>在线聊天室</span>
      </el-menu-item>
      <el-menu-item index="home/1">
        <span>敬请期待</span>
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
