<script setup>
import { ref, toRef } from 'vue'
let props = defineProps(['msgList', 'srcList', 'avatarList', 'username'])
let msgList = toRef(props, 'msgList')

//对应用户头像
const findAvatar = (item) => {
  let obj = props.avatarList.find((t) => t.username == item)
  if (obj?.['avatar']) return obj['avatar']
}
</script>

<template>
  <li
    v-for="item in msgList"
    :key="item.id"
    :class="[item.user == username ? 'msgright' : 'msgleft']"
  >
    <div class="timebox" v-if="item.time !== false">
      <p style="text-align: center">{{ item.time }}</p>
    </div>
    <div v-if="item.user == username" class="msg msgright">
      <div class="msgrightbox" style="margin-right: 5px">
        <span class="textuser" style="text-align: right">{{ item.user }}</span>
        <span v-if="item.msg.startsWith('http')">
          <el-image
            style="width: 120px; height: 150px"
            :src="item.msg"
            :zoom-rate="1.2"
            :initial-index="item.index"
            :preview-src-list="srcList"
            fit="cover"
          />
        </span>
        <span v-else class="textmsg boxright"> {{ item.msg }}</span>
      </div>
      <div class="avatarbox">
        <el-avatar
          shape="square"
          fit="fill"
          :size="30"
          :src="findAvatar(item.user)"
        />
      </div>
    </div>
    <div v-else class="msg msgleft">
      <div class="avatarbox">
        <el-avatar
          shape="square"
          fit="fill"
          :size="30"
          :src="findAvatar(item.user)"
        />
      </div>
      <div class="msgrightbox" style="margin-left: 5px">
        <span class="textuser">{{ item.user }}</span>
        <span v-if="item.msg.startsWith('http')">
          <el-image
            style="width: 120px; height: 150px"
            :src="item.msg"
            :zoom-rate="1.2"
            :initial-index="item.index"
            :preview-src-list="srcList"
            fit="cover"
          />
        </span>
        <span v-else class="textmsg boxleft"> {{ item.msg }}</span>
      </div>
    </div>
  </li>
</template>

<style lang="css"></style>
