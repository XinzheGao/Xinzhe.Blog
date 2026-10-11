const dayjs = require('dayjs')
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))
dayjs.extend(require('dayjs/plugin/localizedFormat'))
require('dayjs/locale/en')
require('dayjs/locale/ja')
require('dayjs/locale/zh-cn')

function formatContentDate(date, language = 'zh', timezone = 'Asia/Tokyo') {
  const locale = language === 'zh' ? 'zh-cn' : language
  return dayjs(date).tz(timezone).locale(locale).format('ll')
}

module.exports = { formatContentDate }
