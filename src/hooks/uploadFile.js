import SparkMD5 from 'spark-md5'
export default function () {
  function handleFileChunk (file, chunkSize) {
    const fileChunkList = []
    // 索引值
    let curIndex = 0
    while (curIndex < file.size) {
      // 最后一个切片以实际结束大小为准。
      const endIndex = curIndex + chunkSize < file.size ? curIndex + chunkSize : file.size
      // 截取当前切片大小
      const curFileChunkFile = file.slice(curIndex, endIndex)
      // 更新当前索引
      curIndex += chunkSize
      fileChunkList.push({ file: curFileChunkFile })
    }
    return fileChunkList
  }
  //设置默认切片大小为5M
  const DefaultChunkSize = 5 * 1024 * 1024

  const start = async function (bigFile, sender, reciver = '', type) {
    // 生成多个切片
    const fileList = handleFileChunk(bigFile, DefaultChunkSize)
    // 获取整个大文件的内容hash,方便实现秒传
    // const containerHash = await getFileHash(fileList);
    const containerHash = await getFileHash2(bigFile)
    // 给每个切片添加辅助内容信息
    const chunksInfo = fileList.map(({ file }, index) => ({
      // 整个文件hash
      fileHash: containerHash,
      // 当前切片的hash
      hash: containerHash + "-" + index,
      // 当前是第几个切片
      index,
      // 文件个数
      fileCount: fileList.length,
      // 切片内容
      chunk: file,
      // 文件总体大小
      totalSize: bigFile.size,
      // 单个文件大小
      size: file.size,
    }))

    //上传所有文件
    return uploadChunks(chunksInfo, bigFile.name, sender, reciver, type)
  }

  /**
   *
   * 获取全部文件内容hash
   * @param {any} fileList
   */
  async function getFileHash (fileList) {
    console.time("filehash")
    const spark = new SparkMD5.ArrayBuffer()
    // 获取全部内容
    const result = fileList.map((item, key) => {
      return getFileContent(item.file)
    })
    try {
      const contentList = await Promise.all(result)
      for (let i = 0; i < contentList.length; i++) {
        spark.append(contentList[i])
      }
      // 生成指纹
      const res = spark.end()
      console.timeEnd("filehash")
      return res
    } catch (e) {
      console.log(e)
    }
  }

  /**
   *
   * 获取全部文件内容hash
   * @param {any} fileList
   */
  async function getFileHash2 (fileList) {
    console.time("filehash")
    const spark = new SparkMD5.ArrayBuffer()
    // 获取全部内容
    const content = await getFileContent(fileList)
    try {
      spark.append(content)
      // 生成指纹
      const result = spark.end()
      return result
    } catch (e) {
      console.log(e)
    }
  }

  /**
   *
   * 获取文件内容
   * @param {any} file
   */
  function getFileContent (file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      // 读取文件内容
      fileReader.readAsArrayBuffer(file)
      fileReader.onload = (e) => {
        // 返回读取到的文件内容
        resolve(e.target.result)
      }
      fileReader.onerror = (e) => {
        reject(fileReader.error)
        fileReader.abort()
      }
    })
  }

  /**
   *
   * 上传所有的分片
   * @param {any} chunks
   * @param {any} fileName
   */
  async function uploadChunks (chunks, fileName, sender, reciver = '', type) {

    const requestList = chunks
      .map(({ chunk, hash, fileHash, index, fileCount, size, totalSize }) => {
        //生成每个切片上传的信息
        const formData = new FormData()
        formData.append("hash", hash)
        formData.append("index", index)
        formData.append("fileCount", fileCount)
        formData.append("size", size)
        formData.append("splitSize", DefaultChunkSize)
        formData.append("fileName", fileName)
        formData.append("fileHash", fileHash)
        formData.append("chunk", chunk)
        formData.append("totalSize", totalSize)
        return { formData, index }
      })
      .map(async ({ formData, index }) =>
        singleRequest({
          url: reciver ? `http://127.0.0.1:3000/singalroom/uploadfile?sender=${sender}&reciver=${reciver}&type=${type}` : `http://127.0.0.1:3000/onlineroom/uploadfile?sender=${sender}&type=${type}`,
          data: formData,
          headers: {
            Authorization: localStorage.getItem("token")
          }
        })
      )
    //全部上传
    let result = await Promise.all(requestList)
    return JSON.parse(result)
  }

  /**
   * 单个文件上传
   */
  function singleRequest ({ url, method = "post", data, headers = {} }) {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open(method, url)
      Object.keys(headers).forEach((key) => xhr.setRequestHeader(key, headers[key]))
      xhr.send(data)
      xhr.onload = function (e) {
        if (this.status == 200) {
          resolve(this.responseText)
        }
      }
    })
  }
  return { start }
}