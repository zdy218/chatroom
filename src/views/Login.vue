<script setup>
import { ref, onMounted } from 'vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'

const activeName = ref('Login')
const login = ref(null)
const register = ref(null)
const container = ref(null)

onMounted(() => {
  login.value.style.transform = 'scale(1.15)'
})

const changeTab = (type) => {
  activeName.value = type
  if (type === 'Login') {
    container.value.style.height = '350px'
    login.value.style.transform = 'scale(1.15)'
    register.value.style.transform = 'scale(1)'
  } else {
    container.value.style.height = '420px'
    login.value.style.transform = 'scale(1)'
    register.value.style.transform = 'scale(1.14)'
  }
}
</script>

<template>
  <div class="box">
    <el-row class="header">
      <span class="login" @click="changeTab('Login')" ref="login">登录</span>
      <span class="register" @click="changeTab('Register')" ref="register"
        >注册</span
      >
    </el-row>
    <div class="container" ref="container">
      <component :is="Login" v-if="activeName === 'Login'" />
      <component :is="Register" v-if="activeName === 'Register'" />
    </div>
  </div>
</template>
<style scoped lang="scss">
.box {
  width: 350px;
  height: 350px;
  position: absolute;
  inset: 0;
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.container {
  width: 350px;
  height: 350px;
  background-color: white;
  border-radius: 15px;
  margin-top: 5px;
}
.header {
  width: 330px;

  .login {
    text-align: center;
    vertical-align: center;
    font-size: 16px;
    line-height: 40px;
    width: 48%;
    background-image: url('../assets/image/back1.png');
    background-size: 100%;
    cursor: pointer;
  }
  .register {
    font-size: 16px;
    line-height: 40px;
    width: 52%;
    text-align: center;
    background-size: 100%;
    background-image: url('../assets/image/back3.png');
    cursor: pointer;
  }
}
</style>
