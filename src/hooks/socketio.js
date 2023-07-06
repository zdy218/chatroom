import { io } from 'socket.io-client'
function useScoketIo () {

  const socket = io('http://localhost:3001')
  return socket

}
export default useScoketIo