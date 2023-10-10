import axios from "axios"



const service = axios.create({
  baseURL: "http://127.0.0.1:3000",
  timeout: 8000,
  // headers: {
  //   "Content-Type": "application/json;charset=uft-8",

  // }
})

service.interceptors.request.use((config) => {
  config.headers['Authorization'] = window.localStorage.getItem('token')
  return config
})

service.interceptors.response.use((res) => {
  let data = res.data
  if (data.msg) {
    console.log(data.msg)
  }
  return res

}, (err) => {
  console.log("服务器出错", err)
})

export default service