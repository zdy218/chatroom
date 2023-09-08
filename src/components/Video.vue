<script setup>
import { ref, onMounted } from 'vue'
const video = ref(null)

const onSuccess = (stream) => {
  const videoTracks = stream.getVideoTracks()
  console.log('视频设备: ' + videoTracks[0].label)
  const audioTracks = stream.getAudioTracks()
  console.log('音频设备: ' + audioTracks[0].label)
  // 播放轨道获取的流
  video.value.srcObject = stream
}

const onError = (error) => console.log(error)

const constraints = {
  audio: true,
  video: true,
}
onMounted(() => {
  // 访问媒体设备
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(onSuccess)
    .catch(onError)
})
</script>

<template>
  <div><video id="video" autoplay ref="video"></video></div>
</template>

<style lang="scss"></style>
