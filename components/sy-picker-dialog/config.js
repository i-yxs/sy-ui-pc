
const reg = /(.*\/)*([^.]+).*/ig
const config = {}
const context = require.context('@/tableConfig/', true, /\.js$/)
context.keys().forEach(key => {
    config[key.replace(reg, '$2')] = context(key).default
})
export default config
