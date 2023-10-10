export default function () {
  /**
   * 日期对象
   */
  let time = {
    year: 0,
    month: 0,
    day: 0,
    hours: 0,
    minutes: 0,
  }
  /**
   * 将日期对象转换成年，月，日，时，分
   * @param {日期对象} date
   */
  const caculateTime = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    //const seconds = String(date.getSeconds()).padStart(2, '0')
    return { year, month, day, hours, minutes }
  }

  /**
   * 对比两个时间是否相等或者有没有超过三分钟
   * @param {最新的时间前一个时间} oldtime
   * @param {最新的时间} newtime
   */
  const compareTime = (oldtime, newtime) => {
    if (oldtime.year === 0) return false
    return (
      oldtime.year === newtime.year &&
      oldtime.month === newtime.month &&
      oldtime.day === newtime.day &&
      oldtime.hours === newtime.hours &&
      (oldtime.minutes === newtime.minutes ||
        newtime.minutes - oldtime.minutes <= 3)
    )
  }
  const handleDate = (newDate, oldDate) => {
    let result = ''
    if (newDate.year !== oldDate.year) {
      result = `${oldDate.year}年${oldDate.month}月${oldDate.day}日 ${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
    } else if (newDate.month !== oldDate.month) {
      result = `${oldDate.month}月${oldDate.day}日 ${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
    } else if (newDate.day !== oldDate.day) {
      if (newDate.day - oldDate.day === 1) {
        result = `昨天 ${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
      } else if (newDate.day - oldDate.day === 2) {
        result = `前天 ${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
      } else {
        result = `${oldDate.month}月${oldDate.day}日 ${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
      }
    } else if (newDate.hours !== oldDate.hours) {
      result = `${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
    } else {
      result = `${String(oldDate.hours).padStart(2, 0)}:${String(oldDate.minutes).padStart(2, 0)}`
    }

    return result ? result : false
  }
  const handleTime = (oldtime) => {
    const newDate = caculateTime(new Date())
    const oldDate = caculateTime(new Date(oldtime))

    if (compareTime(time, oldDate)) return false
    else {
      time = Object.assign(time, oldDate)
    }
    return handleDate(newDate, oldDate)
  }

  const handleAddTime = (lastTime, addTime) => {
    const lastDate = caculateTime(new Date(lastTime))
    const addDate = caculateTime(new Date(addTime))
    if (compareTime(lastDate, addDate)) return false
    return handleDate(lastDate, addDate)
  }
  const compareAddTime = (lastTime, addTime) => {
    const lastDate = caculateTime(new Date(lastTime))
    const addDate = caculateTime(new Date(addTime))
    return compareTime(lastDate, addDate)
  }
  return { handleTime, handleAddTime, compareAddTime }
}