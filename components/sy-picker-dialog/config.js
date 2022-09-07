
const reg = /(.*\/)*([^.]+).*/ig
const config = {}
try {
    const context = require.context('@/tableConfig/', true, /\.js$/)
    context.keys().forEach(key => {
        config[key.replace(reg, '$2')] = context(key).default
    })
} catch (err) {
    // 根目录没有tableConfig文件夹
}
export default config
