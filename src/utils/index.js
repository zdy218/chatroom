import service from './service'

//获取历史聊天记录
export const getHistory = async () => { return await service({ url: '/onlineroom' }) }

//发送信息
export const sendMsg = async (data) => { return await service({ url: '/onlineroom/send', method: 'post', data }) }

//获取用户信息
export const getSelf = async (data) => { return await service({ url: '/user/getSelf', method: 'post', data }) }

//获取所有用户头像

export const getAvatarList = async () => { return await service({ url: '/user/getavatar' }) }
//搜索用户
export const searchUser = async (data) => { return await service({ url: '/user/search', method: 'post', data }) }

//添加最近聊天用户
export const addRecentChat = async (data) => { return await service({ url: '/user/addrecentchat', method: 'post', data }) }

//获取最近聊天用户
export const getRecentChat = async (data) => { return await service({ url: '/user/getrecentchat', method: 'post', data }) }
//获取私聊数据
export const getSingalHistory = async (data) => { return await service({ url: '/singalroom', method: 'post', data }) }

//发送私聊信息
export const sendSingalMsg = async (data) => { return await service({ url: '/singalroom/send', method: 'post', data }) }