
import service from './service'
import axios from 'axios'
//获取历史聊天记录
export const getHistory = async () => { return await service({ url: '/onlineroom' }) }

//发送信息
export const sendMsg = async (data) => { return await service({ url: '/onlineroom/send', method: 'post', data }) }

//获取用户信息
export const getSelfAvatar = async (data) => { return await service({ url: '/user/getSelf', method: 'post', data }) }

//获取所有用户头像

export const getAvatarList = async () => { return await service({ url: '/user/getavatar', }) }
//搜索用户
export const searchUser = async (data) => { return await service({ url: '/user/search', method: 'post', data }) }

//添加最近聊天用户
export const addRecentChat = async (data) => { return await service({ url: '/user/addrecentchat', method: 'post', data }) }

//获取最近聊天用户
export const getRecentChat = async (data) => { return await service({ url: '/user/getrecentchat', method: 'post', data }) }

//获取私聊信息
export const getSingalHistory = async (data) => { return await service({ url: '/singalroom', method: 'post', data }) }

//发送私聊信息
export const sendSingalMsg = async (data) => { return await service({ url: '/singalroom/send', method: 'post', data }) }

//添加私聊信息
export const addUnreadMsg = async (data) => { return await service({ url: '/user/addUnreadMsg', method: 'post', data }) }

//更新未读私聊信息数目
export const updateUnreadMsgNum = async (data) => { return await service({ url: '/user/updateUnreadMsgNum', method: 'post', data }) }

//获取所有未读信息数目
export const getAllUnreadMsg = async (data) => { return await service({ url: '/user/getAllUnreadMsg', method: 'post', data }) }

//已读消息
export const readMsg = async (data) => { return await service({ url: '/user/readMsg', method: 'post', data }) }

//获取最近消息
export const getLastedMsg = async (data) => { return await service({ url: '/singalroom/getLastedMsg', method: 'post', data }) }

//获取最近消息
export const getOnlineLastedMsg = async () => { return await service({ url: '/onlineroom/getLastedMsg', method: 'post' }) }

//存储聊天中发送的图片文件
export const stroageImage = async ({ data, formData }) => {

  return await service({
    url: '/singalroom/stroageImage', method: 'post', data: formData, headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: data
  })
}

//存储聊天中发送的图片文件
export const stroageOnlineImage = async ({ data, formData }) => {

  return await service({
    url: '/onlineroom/stroageImage', method: 'post', data: formData, headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: data
  })
}
//更新用户状态
export const updateOnlineStatus = async (data) => { return await service({ url: '/user/update/onlineStatus', method: 'post', data }) }

//获取用户状态
export const getOnlineStatu = async (data) => { return await service({ url: '/user/getOnlineStatu', method: 'post', data }) }


//获取是否有重复用户
export const getRepeatedUser = async (data) => { return await service({ url: '/user/getRepeatedUser', method: 'post', data }) }

//登录
export const login = async (data) => { return await service({ url: '/user/login', method: 'post', data }) }

//获取好友列表
export const getFriendList = async (params) => { return await service({ url: '/user/getFriendList', params }) }

//添加好友
export const addFriend = async (data) => { return await service({ url: '/user/addFriend', method: 'post', data }) }

//更新好友状态
export const changeStatusAndHandle = async (data) => { return await service({ url: '/user/changeStatusAndHandle', method: 'post', data }) }


//发送文件
export const fileUpload = async ({ formData, data }) => {

  return await service({
    url: '/singalroom/uploadfile', method: 'post', data: formData, params: data
  })
}