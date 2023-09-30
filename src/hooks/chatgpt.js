import { ChatGPTAPI } from 'chatgpt'
async function example () {
  const api = new ChatGPTAPI({
    apiKey: 'moss-cuttc4iq516cf9ee7o237pu2v5kl01q8smn8mc5eb3046dar',
    apiBaseUrl: 'http://api.aihao123.cn/v1',
    completionParams: {
      model: 'gpt-3.5-turbo',
      // model: 'gpt-3.5-turbo-16k'
      // model: 'gpt-4'
    },
  })
  const res = await api.sendMessage('你是ChatGPT哪个版本？', {
    onProgress: (partialResponse) => console.log(partialResponse.text),
  })
}

export default example