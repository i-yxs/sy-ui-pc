
import store from '@/store'
import dateTools from '../utils/dateTools'
// 文件类型
export const FILE_TYPE = {
    'image': 'bmp,jpg,jpeg,png,gif,webp'.split(','),
    'video': 'mp4,m3u8,ogg,webm'.split(',')
}
// 是否Promise对象
export function isPromise(value) {
    return value && typeof value.then === 'function'
}
// 数字补零
export function numberPad(n) {
    return String(n).padStart(2, '0')
}
// 获取文件类型
export function getFileType(fileName) {
    return Object.keys(FILE_TYPE).find(type => {
        return FILE_TYPE[type].findIndex(name => new RegExp(name + '$', 'i').test(fileName)) > -1
    }) || 'file'
}
/**
 * 如果传入的value数据格式为function，则执行它
 * @param {Any} value 判断的值
 * @param {Object} data 传递的参数
 */
export function get2Function(value, data) {
    if (typeof value === 'function') {
        return value(data)
    }
    return value
}
// 判断是否为空
export function isEmpty(value) {
    return ['', null, void 0].includes(value)
}
/**
 * 数据类型判断
 * @param {Any} obj 需要判断的对象
 * @param {String} name 数据类型名称（可选，不传时返回类型名称）
 */
export function isType(obj, name) {
    let toString = Object.prototype.toString.call(obj).toLowerCase()
    if (isEmpty(name)) {
        return /^\[object (\w+)\]$/.exec(toString)[1]
    } else {
        return toString === '[object ' + name.toLowerCase() + ']'
    }
}
// 对象转url
export function objectToUrl(obj) {
    let url = ''
    if (!isEmpty(obj) && typeof obj === 'object') {
        Object.keys(obj).filter(key => !isEmpty(obj[key])).forEach(key => {
            url += url ? '&' : ''
            url += `${key}=${obj[key]}`
        })
    }
    return url
}
// url转对象
export function urlToObject(url) {
    let obj = {}
    url.substring(url.indexOf('?') + 1).split('&').forEach(item => {
        let [prop, value] = item.split('=')
        obj[prop] = value
    })
    return obj
}
/**
 * 格式化金额数字
 */
export function moneyFormat(value, precision = 2) {
    return Number(value).toLocaleString('zh', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    })
}
/**
 * 获取对象的指定属性值
 * @param {Object} obj 需要操作的对象
 * @param {String} key 需要获取的属性名，可以使用链式写法
 * @param {Boolean} consoleError 是否打印错误信息
 */
export function getProperty(obj, key = '', consoleError) {
    try {
        return key.split('.').reduce((data, key) => data[key], obj)
    } catch (err) {
        if (consoleError) console.error(err)
    }
}
/**
 * 获取字典
 * @param {String} typeName 字典类型名称
 */
export function getDictData(typeName) {
    return getProperty(store, `state.stableData.dict.${typeName}`) || []
}
/**
 * 获取字典属性
 * @param {Any} value 字典value
 * @param {String} type 字典类型名称
 * @param {String} prop 需要获取的属性名
 */
export function getDictProp(value, type, prop = 'label', options) {
    options = {
        valueKey: 'value',
        defaultValue: '- -',
        ...options
    }
    let data = Array.isArray(type) ? type : getDictData(type)
    if (Array.isArray(data)) {
        // 根据value找到子项数据
        data = data.find(item => item[options.valueKey] === value)
        if (isEmpty(prop)) {
            // 如果prop为空，则返回子项数据
            return data
        } else if (data) {
            return isEmpty(data[prop]) ? options.defaultValue : data[prop]
        }
    }
    return options.defaultValue
}
/**
 * 根据指定id获取树形结构数据相应的节点数据
 * @param {Array} data 数据
 * @param {Array | String} value 需要获取的节点value，当为数组时则默认为节点路径
 * @param {String} valueKey 数据中的id的属性名
 * @param {String} childrenKey 数据中的children的属性名
 */
export function getTreeNode(option) {
    option = {
        data: [],
        valueKey: 'value',
        childrenKey: 'children',
        ...option
    }
    let nodes = []
    if (Array.isArray(option.value)) {
        let children = option.data
        option.value.find(id => {
            if (Array.isArray(children)) {
                let node = children.find(v => v[option.valueKey] === id)
                if (node) {
                    nodes.push(node)
                    children = node[option.childrenKey]
                    return
                }
            }
            nodes = []
            return true
        })
        return nodes
    } else {
        let paths = {}
        let recursion = (children, path = '') => {
            if (Array.isArray(children)) {
                children.forEach((node, index) => {
                    paths[node[option.valueKey]] = path ? `${path}.${index}` : `${index}`
                    recursion(node[option.childrenKey], paths[node[option.valueKey]])
                })
            }
        }
        recursion(option.data)
        let path = paths[option.value]
        if (path) {
            let children = option.data
            path.split('.').forEach(index => {
                nodes.push(children[index])
                children = children[index][option.childrenKey]
            })
        }
    }
    return nodes
}
/**
 * 连字符写法转驼峰写法
 * @param {String} str 需要转换的字符串
 * @param {Boolean} reverse 是否反向转换
 */
export function hyphenationToCamel(str, reverse) {
    if (reverse) {
        return str.replace(/([A-Z])/g, (_, c) => c ? '-' + c.toLowerCase() : '')
    }
    return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}
/**
 * 组件的attrs转props
 * @param {Object} attrs 待转换的attrs对象
 * @param {Array} booleanKeys 数据类型为Boolean的属性名列表
 */
export function attrsToProps(attrs, booleanKeys = []) {
    let props = {}
    Object.keys(attrs).forEach(key => {
        let name = hyphenationToCamel(key)
        props[name] = attrs[key] === '' && booleanKeys.includes(name) ? true : attrs[key]
    })
    return props
}
/**
 * 深度合并
 */
export function deepMerge() {
    function merge(obj1, obj2) {
        if (isType(obj2, 'object')) {
            obj1 = isType(obj1, 'object') ? obj1 : {}
            Object.keys(obj2).forEach(key => {
                if (isType(obj2[key], 'object')) {
                    obj1[key] = merge(obj1[key], obj2[key])
                } else {
                    obj1[key] = obj2[key]
                }
            })
        }
        return obj1
    }
    return Array.prototype.slice.apply(arguments).reduce(merge)
}
/**
 * 差量合并，只有当源对象没有的属性时才会赋值到源对象
 * @param {Object} obj1 源对象
 * @param {Object} obj2 进行比较的对象
 */
export function differenceMerge() {
    function merge(obj1, obj2) {
        if (isType(obj2, 'object')) {
            if (isType(obj1, 'object')) {
                Object.keys(obj2).forEach(key => {
                    if (!(key in obj1)) {
                        obj1[key] = obj2[key]
                    } else {
                        if (isType(obj1[key], 'object') && isType(obj2[key], 'object')) {
                            differenceMerge(obj1[key], obj2[key])
                        }
                    }
                })
            } else {
                return obj2
            }
        }
        return obj1
    }
    return Array.prototype.slice.apply(arguments).reduce(merge)
}

/**
 * 解决接口请求过快，导致页面loading还没显示就已经关闭，
 * 页面看起来就像没有变化，用户体验不太好，所以该方法接收一个Promise，
 * 接收的Promise成功时过去的时间必须大于指定的时间，否则等待剩余时间
 * @param promise 需要处理的Promise对象
 * @param time 最小处理时间/毫秒
 * @returns {Promise}
 */
export function limitedPromise(promise, time = 300) {
    return new Promise((resolve, reject) => {
        let startTime = Date.now()
        promise.then(res => {
            let pastTime = Date.now() - startTime
            if (pastTime >= time) {
                resolve(res)
            } else {
                setTimeout(() => resolve(res), time - pastTime)
            }
        }).catch(reject)
    })
}
/**
 * 批量watch，必须将该函数的this指向需要观察的vue实例
 * @param {Object} context 绑定的对象，会将该对象设置为回调函数的this，该对象下必须包含watchs属性
 */
export function batchWatch(target) {
    if (isType(target, 'object') && Array.isArray(target.watchs)) {
        if (!Array.isArray(this.__batchWatchs_)) {
            this.__batchWatchs_ = []
        }
        let index = this.__batchWatchs_.findIndex(item => item.target === target)
        if (index > -1) {
            this.__batchWatchs_[index].unwatch.forEach(unwatch => unwatch())
            this.__batchWatchs_.splice(index, 1)
        }
        let watch = {
            target,
            unwatch: []
        }
        target.watchs.forEach(({ expOrFn, callback, options, context }) => {
            let unwatch = context.$watch(expOrFn, function(newVal, oldVal) {
                callback.call(target, newVal, oldVal)
            }, {
                immediate: true,
                ...options
            })
            watch.unwatch.push(unwatch)
        })
        this.__batchWatchs_.push(watch)
    }
}
/**
 * 清除树形结构数据长度为0的children
 * @param {Array} data 数据
 * @param {String} childrenKey 数据中的children的属性名
 */
export function clearEmptyArray(option) {
    option = {
        data: [],
        childrenKey: 'children',
        ...option
    }
    let recursion = (children) => {
        children.forEach(node => {
            if (Array.isArray(node[option.childrenKey])) {
                if (node[option.childrenKey].length) {
                    recursion(node[option.childrenKey])
                } else {
                    node[option.childrenKey] = null
                }
            }
        })
    }
    recursion(option.data)
}
/**
 * 过滤列表
 * @param list 数据列表
 * @param params 过滤参数
 * @param configs 过滤配置
 * [
 *     {
 *          prop: '需要比较的属性名称',
 *          type: '比较类型'    1、string 字符串模糊比较 2、same 完全相同 3、date 日期
 *          filter: 自定义过滤方法
 *          dataKey: 数据属性名称
 *     }
 * ]
 */
export function filterList(list, params, configs) {
    if (Array.isArray(list)) {
        return list.filter(item => {
            return configs.findIndex(config => {
                let value1 = item[config.dataKey || config.prop]
                let value2 = params[config.prop]
                if (typeof config.filter === 'function') {
                    return !config.filter(item)
                }
                if (isEmpty(value2)) return
                switch (config.type) {
                case 'same': return value1 !== value2
                case 'date': return dateTools.parse(value1) !== dateTools.parse(value2)
                case 'array':
                    value1 = Array.isArray(value1) ? value1 : []
                    value2 = Array.isArray(value2) ? value2 : []
                    return value1.toString() !== value2.toString()
                case 'string': return isEmpty(value1) || value1.indexOf(value2) === -1
                case 'dateRange':
                    if (Array.isArray(value2)) {
                        if (!isEmpty(value2[0]) && !isEmpty(value2[1])) {
                            let now = dateTools.parse(value1)
                            let min = dateTools.parse(value2[0])
                            let max = dateTools.parse(value2[1])
                            return now < min || now > max
                        }
                    }
                    return true
                }
            }) === -1
        })
    }
    return []
}
/**
 * jsonp请求
 * @param {Object} url 地址
 * @param {Object} params 参数
 * @param {String} callback 回调函数名
 */
export function jsonp(options) {
    return new Promise((resolve, reject) => {
        let url = options.url
        let head = document.querySelector('head')
        let script = document.createElement('script')
        let callback = options.callback || `axios_callback_${Date.now()}`
        window[callback] = (result) => {
            head.removeChild(script)
            resolve(result)
        }
        let params = {
            ...options.params,
            callback
        }
        url = url + `${/\?/.test(url) ? '&' : '?'}` + objectToUrl(params)
        script.type = 'text/javascript'
        script.src = url
        script.onload = function(result) {
            console.log(result)
        }
        script.onerror = reject
        head.appendChild(script)
    })
}
