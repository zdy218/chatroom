<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFormCheck } from '../hooks'
import { ElMessage } from 'element-plus'
import { login } from '../utils'
import 'element-plus/theme-chalk/src/message.scss'
const { checkUsername, checkPassword, submitForm } = useFormCheck()
const router = useRouter()
const loginForm = reactive({
  username: '',
  password: '',
})
const ruleFormRef = ref(null)

const rules = reactive({
  username: [{ validator: checkUsername, trigger: 'blur', required: true }],
  password: [{ validator: checkPassword, trigger: 'blur', required: true }],
})
const handleEnterBtnClick = async () => {
  let res = await login({
    username: loginForm.username,
    password: loginForm.password,
  })
  if (res.data.code === 200) {
    localStorage.setItem('username', loginForm.username)
    localStorage.setItem('token', res.data.result.token)
    ElMessage.success('登录成功')
    router.push('/')
  } else {
    ElMessage.error(res.data.result)
  }
}
</script>

<template>
  <div class="loginBox">
    <el-form
      ref="ruleFormRef"
      :model="loginForm"
      status-icon
      :rules="rules"
      label-width="120px"
      class="demo-ruleForm"
      label-position="top"
    >
      <el-form-item label="用户名" prop="username" style="width: 240px">
        <el-input v-model="loginForm.username" type="text" />
      </el-form-item>
      <el-form-item label="密码" prop="password" style="width: 240px">
        <el-input
          v-model="loginForm.password"
          type="password"
          autocomplete="off"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="submitForm(ruleFormRef, handleEnterBtnClick)"
          >进入聊天室</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.loginBox {
  width: 100%;
  position: relative;
  .el-form {
    width: 100%;
    height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .el-form-item {
      margin-top: 20px;
    }
  }
}
</style>
