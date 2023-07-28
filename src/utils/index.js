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