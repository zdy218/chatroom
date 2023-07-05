<script setup>
import { ref, onBeforeMount } from 'vue'
const emojis = []
const emits = defineEmits(['sendEmoji'])
onBeforeMount(() => {
  for (let i = 0x1f600; i <= 0x1f64f; i++) {
    if (i === 0x1f641 || i === 0x1f642) {
      continue
    }

    emojis.push(String.fromCodePoint(i))
  }
})
const handleEmit = (item) => {
  emits('sendEmoji', item)
}
</script>

<template>
  <div class="container">
    <p>表情</p>
    <div>
      <span v-for="item in emojis" :key="item" @click="handleEmit(item)">
        {{ item }}</span
      >
    </div>
  </div>
</template>
<style lang="scss" scoped>
.container {
  position: absolute;
  background-color: white;
  border-radius: 5px;
  width: 300px;
  overflow: scroll;
  div {
    display: flex;
    flex-wrap: wrap;
    height: 300px;
    span {
      height: 30px;
      font-size: 24px;
      margin: 8px 10px;
      &:hover {
        cursor: pointer;
      }
    }
  }
}
</style>
