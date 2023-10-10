export default function () {
  const checkUsername = (rule, value, callback) => {
    if (!value) {
      return callback(new Error('请输入用户名'))
    }
    setTimeout(() => {
      if (value.trim().length < 6) {
        callback(new Error('用户名长度不得小于6'))
      } else {
        callback()
      }
    }, 500)
  }

  const checkPassword = (rule, value, callback) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
    if (value === '') {
      callback(new Error('请输入密码'))
    }
    setTimeout(() => {
      if (value.trim().length < 8) {
        callback(new Error('密码长度不得小于8'))
      } else if (!regex.test(value)) {
        callback(new Error('密码必须由大小写字母和数字组成'))
      }
      else {
        callback()
      }
    }, 500)
  }
  const submitForm = (formEl, callback) => {
    if (!formEl) return
    formEl.validate(async (valid) => {
      if (valid) {
        callback()

      } else {
        console.log('error submit!')
        return false
      }
    })
  }
  return { checkPassword, checkUsername, submitForm }
}