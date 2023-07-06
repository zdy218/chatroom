import service from './service'

//获取历史聊天记录
export const getHistory = async () => { return await service({ url: '/onlineroom' }) }

//发送信息
export const sendMsg = async (data) => { return await service({ url: '/onlineroom/send', method: 'post', data }) }

//搜索用户
export const searchUser = async (data) => { return await service({ url: '/search', method: 'post', data }) }