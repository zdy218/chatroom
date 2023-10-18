export default function () {
  const throttle = (fn, time) => {
    let timeId = null
    let timeExced = 0
    return function (...args) {
      const now = Date.now()
      if (now - timeExced >= time) {
        fn?.apply(this, args)
      } else {
        clearTimeout(timeId)
        timeId = setTimeout(() => {
          fn?.apply(this, args)
        }, time)
      }

    }
  }
  return { throttle }
}