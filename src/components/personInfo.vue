<script setup>
import { toRef } from 'vue'
let props = defineProps(['username', 'avatar', 'friendList', 'status'])
let emits = defineEmits(['send', 'addFriend'])
</script>

<template>
  <div class="content" v-show="username.trim().length > 0">
    <div class="box">
      <el-avatar shape="square" fit="fit" :size="60" :src="avatar" />
      <p style="margin-left: 20px; color: black">
        {{ username }}
      </p>
    </div>
    <div>
      <el-button
        type="primary"
        v-if="!friendList.find((t) => t.friendname === username)"
        @click="emits('addFriend', username)"
        >加好友</el-button
      >
      <el-button v-else-if="!status" class="statusbox" disabled
        >待同意</el-button
      >
      <el-button type="success" @click="emits('send', username)"
        >发消息</el-button
      >
    </div>
  </div>
</template>

<style lang="scss">
.content {
  .box {
    display: flex;
    align-items: center;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  .el-button {
    margin-top: 20px;
  }
}
</style>
