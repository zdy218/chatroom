<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useFormCheck } from '../hooks'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getRepeatedUser } from '../utils'
import 'element-plus/theme-chalk/src/message.scss'
const { checkUsername, checkPassword, submitForm } = useFormCheck()

let registerForm = reactive({
  avatar: null,
  username: '',
  password: '',
  uploaded: true,
})
const ruleFormRef1 = ref(null)
const uploadRef = ref(null)
const rules = reactive({
  avatar: [{ required: true, message: '请选择头像', trigger: 'blur' }],
  username: [{ validator: checkUsername, trigger: 'blur', required: true }],
  password: [{ validator: checkPassword, trigger: 'blur', required: true }],
})
const handleAvatarSuccess = () => {
  registerForm.avatar = ''
  registerForm.username = ''
  registerForm.password = ''
  ElMessage.success('注册成功!')
}
const changeAvatarUpload = (rawFile) => {
  if (registerForm.uploaded) {
    registerForm.uploaded = false
  } else {
    return
  }
  if (rawFile.raw.type !== 'image/png') {
    registerForm.uploaded = true
    ElMessage.error('Avatar picture must be  PNG format!')
    return false
  } else if (rawFile.raw.size / 1024 / 1024 > 2) {
    registerForm.uploaded = true
    ElMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }
  registerForm.data = rawFile.raw
  const reader = new FileReader()
  reader.readAsDataURL(rawFile.raw)
  reader.onload = (e) => {
    registerForm.avatar = e.target.result
  }
  registerForm.uploaded = true
}
const beforeAvatarUpload = async () => {
  let res = await getRepeatedUser({ username: registerForm.username })
  if (res.data.result === 'repeated') {
    ElMessage.error('用户名已存在!')
    return false
  }
}
</script>

<template>
  <div class="registerBox">
    <el-form
      ref="ruleFormRef1"
      :model="registerForm"
      status-icon
      :rules="rules"
      label-width="120px"
      class="demo-ruleForm"
      label-position="top"
    >
      <el-form-item label="头像" prop="avatar" style="width: 240px">
        <el-upload
          ref="uploadRef"
          class="avatar-uploader"
          name="avatar"
          action="http://127.0.0.1:3000/user/register"
          :data="{
            username: registerForm.username,
            password: registerForm.password,
          }"
          :show-file-list="false"
          :auto-upload="false"
          :on-success="handleAvatarSuccess"
          :on-change="changeAvatarUpload"
          :before-upload="beforeAvatarUpload"
        >
          <el-avatar
            v-if="registerForm.avatar"
            shape="square"
            fit="fit"
            :size="40"
            :src="registerForm.avatar"
          />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="用户名" prop="username" style="width: 240px">
        <el-input v-model="registerForm.username" type="text" />
      </el-form-item>
      <el-form-item label="密码" prop="password" style="width: 240px">
        <el-input
          v-model="registerForm.password"
          type="password"
          autocomplete="off"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          @click="submitForm(ruleFormRef1, () => uploadRef.submit())"
          >注册</el-button
        >
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang="scss" scoped>
.registerBox {
  width: 100%;
  position: relative;
  .el-form {
    width: 100%;
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    .el-form-item {
      margin-top: 10px;
      .avatar-uploader-icon {
        margin-left: 8px;
        font-size: 28px;
        color: #8c939d;
        text-align: center;
        background-color: white;
      }
    }
  }
}
</style>
