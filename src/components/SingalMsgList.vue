<script setup>
import { toRef, ref } from 'vue'
import { fileIconUrl } from '../configs'
let props = defineProps([
  'msgList',
  'username',
  'srcList',
  'otheravatar',
  'name',
  'avatar',
])

let msgList = toRef(props, 'msgList')
let otheravatar = toRef(props, 'otheravatar')
const download = ref(null)
const handlesrc = (src) => {
  return `${fileIconUrl}${src}.png`
}
const handleDownload = (url) => {
  // const a = document.createElement('a')
  // a.download = 'filename'
  // a.href = url
  // a.addEventListener('click', () => {})
  // console.log(a)
  // a.click()
  // download.value.href = url
  // console.log(download)
  const link = document.createElement('a')
  link.href = url
  link.download = true
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <li
    v-for="item in msgList"
    :key="item.id"
    :class="[item.sender == username ? 'msgright' : 'msgleft']"
  >
    <div class="timebox" v-if="item.time !== false">
      <p style="text-align: center">{{ item.time }}</p>
    </div>
    <div v-if="item.sender == username" class="msg msgright">
      <div class="msgrightbox" style="margin-right: 5px">
        <span class="textuser" style="text-align: right">{{
          item.sender
        }}</span>
        <span v-if="item.type === 'image'">
          <el-image
            style="width: 120px; height: 150px"
            :src="item.msg"
            :zoom-rate="1.2"
            :initial-index="item.index"
            :preview-src-list="srcList"
            fit="cover"
            lazy
          />
        </span>

        <span v-else-if="item.type === 'text'" class="textmsg boxright">
          {{ item.msg }}</span
        >
        <a
          v-else
          class="filebox"
          ref="download"
          href="#"
          download
          @click.prevent="handleDownload(item.url)"
        >
          <el-image :src="handlesrc(item.type)" />
          <el-text truncated>{{ item.msg }}</el-text>
        </a>
      </div>
      <div class="avatarbox">
        <el-avatar shape="square" fit="fill" :size="30" :src="avatar" />
      </div>
    </div>
    <div v-else class="msg msgleft">
      <div class="avatarbox">
        <el-avatar shape="square" fit="fill" :size="30" :src="otheravatar" />
      </div>
      <div class="msgrightbox" style="margin-left: 5px">
        <span class="textuser">{{ name }}</span>
        <span v-if="item.type === 'image'">
          <el-image
            style="width: 120px; height: 150px"
            :src="item.msg"
            :zoom-rate="1.2"
            :initial-index="item.index"
            :preview-src-list="srcList"
            fit="cover"
            lazy
          />
        </span>
        <span v-else-if="item.type === 'text'" class="textmsg boxleft">
          {{ item.msg }}</span
        >
        <a v-else class="filebox" ref="download" href="#" download>
          <el-image :src="handlesrc(item.type)" />
          <el-text class="w-100px" truncated>{{ item.msg }}</el-text>
        </a>
      </div>
    </div>
  </li>
</template>

<style lang="scss">
.el-container {
  border: 1px solid #ccc;
  position: relative;
  width: 500px;
  min-width: 300px;
  background-color: #f4f4f4;

  ul {
    padding: 0;
    list-style: none;
    li {
      display: flex;
      flex-direction: column;
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

.timebox {
  margin: 0 auto;
  p {
    text-align: center;
    font-size: 12px;
  }
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
.filebox {
  display: block;
  background: #fff;
  display: flex;
  flex-direction: row;

  width: 200px;
  height: fit-content;
  margin-top: 5px;
  padding: 5px;

  margin-left: 10px;
  .el-image {
    width: 28px;
    height: 40px;
  }
  .el-text {
    padding-left: 10px;
    font-size: 14px;
    width: 150px;
  }
  cursor: pointer;
}
</style>
