

export default function () {


  const handleRes = (ElMessage, router, code, msg = '') => {
    if (code === 200) {
      return
    }
    if (code === 403) {

      ElMessage.error(msg)
      router.push('/login')



    }
    if (code === 500) {
      ElMessage.error(msg)
    }



  }




  return { handleRes }
}