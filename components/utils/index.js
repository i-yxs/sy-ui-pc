
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
/**
 * 数字补零
 * @param {Number} value 操作的数值
 * @param {Number} digit 需要补的位数
 */
export function numberPad(value, digit = 2) {
    return String(value).padStart(digit, '0')
}
// 日期格式化
export function dateFormat(value, format = 'YYYY-MM-DD', defaultValue = '- -') {
    return dateTools.format(value, format) || defaultValue
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
 */
export function get2Function(value) {
    if (typeof value === 'function') {
        return value.apply(this, Array.prototype.slice.call(arguments).slice(1))
    }
    return value
}
// 判断是否为空
export function isEmpty(value) {
    return ['', null, void 0].includes(value)
}
// 判断是否为对象
export function isObject(value) {
    return value !== null && typeof value === 'object'
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
// 判断是否是有效数值
export function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value)
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
 * 格式化数字
 */
export function toLocaleString(value, minimumFractionDigits = 2, maximumFractionDigits = 2) {
    value = Number(value)
    if (!isNaN(value)) {
        return value.toLocaleString('zh', {
            minimumFractionDigits,
            maximumFractionDigits
        })
    }
    return ''
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
 * 设置对象的指定属性值
 * @param {Object} obj 需要操作的对象
 * @param {String} key 需要获取的属性名，可以使用链式写法
 * @param {Any} value 设置的值
 * @param {Boolean} consoleError 是否打印错误信息
 */
export function setProperty(obj, key = '', value, consoleError) {
    try {
        let keys = key.split('.')
        keys.slice(0, -1).reduce((data, key) => data[key], obj)[keys.slice(-1)[0]] = value
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
    let paths = {};
    (function recursion(children, path = '') {
        if (Array.isArray(children)) {
            children.forEach((node, index) => {
                paths[node[option.valueKey]] = path ? `${path}.${index}` : `${index}`
                recursion(node[option.childrenKey], paths[node[option.valueKey]])
            })
        }
    })(option.data)
    function getNodes(value) {
        let nodes = []
        let path = paths[value]
        if (path) {
            let children = option.data
            path.split('.').forEach(index => {
                nodes.push(children[index])
                children = children[index][option.childrenKey]
            })
        }
        return nodes
    }

    if (Array.isArray(option.value)) {
        return option.value.map(getNodes)
    } else {
        return getNodes(option.value)
    }
}
/**
 * 连字符写法转驼峰写法
 * @param {String} name 需要转换的字符串
 * @param {Boolean} reverse 是否反向转换
 * @param {Boolean} capitalize 是否首字母大写
 */
export function hyphenationToCamel(name, reverse, capitalize) {
    if (reverse) {
        name = name.replace(/([A-Z])/g, (_, c, i) => c ? i > 0 ? '-' : '' + c.toLowerCase() : '')
    } else {
        name = name.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
    }
    if (capitalize) {
        name = name.slice(0, 1).toLocaleUpperCase() + name.substring(1)
    }
    return name
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
 * 深度合并对象
 */
export function deepMerge() {
    function merge(obj1, obj2) {
        if (isObject(obj2)) {
            if (['array', 'object'].indexOf(isType(obj1)) === -1) {
                switch (isType(obj2)) {
                    case 'array':
                        obj1 = []
                        break
                    case 'object':
                        obj1 = {}
                        break
                }
            }
            Object.keys(obj2).forEach(key => {
                switch (isType(obj2[key])) {
                    case 'object':
                        obj1[key] = merge(obj1[key], obj2[key])
                        break
                    default:
                        obj1[key] = obj2[key]
                        break
                }
            })
        }
        return obj1
    }
    return Array.prototype.slice.apply(arguments).reduce(merge)
}
/**
 * 深度合并对象(Array类型的属性特别处理)
 * 合并原则：
 * 1、如果合并对象属性不为Array、Object类型，将会把合并对象属性覆盖源对象属性
 * 2、如果其中一个属性为Array类型，另一个属性为Array类型，则两个属性的每个项合并
 * 3、如果其中一个属性为Array类型，另一个属性为Object类型，则将Array类型属性的每个项与Object类型属性合并组合成新数组
 */
export function deepMerge2Array() {
    function merge(obj1, obj2) {
        if (isObject(obj2)) {
            if (['array', 'object'].indexOf(isType(obj1)) === -1) {
                switch (isType(obj2)) {
                    case 'array':
                        obj1 = []
                        break
                    case 'object':
                        obj1 = {}
                        break
                }
            }
            Object.keys(obj2).forEach(key => {
                switch (isType(obj2[key])) {
                    case 'array':
                        if (isType(obj1[key], 'object')) {
                            // 如果源属性为对象，则将源属性合并到合并属性的每个项
                            obj1[key] = obj2[key].map(item => deepMerge(null, obj1[key], item))
                        } else {
                            obj1[key] = merge(obj1[key], obj2[key])
                        }
                        break
                    case 'object':
                        if (isType(obj1[key], 'array')) {
                            // 如果源属性为数组，则将合并属性合并到源属性的每个项
                            obj1[key].forEach(item => merge(item, obj2[key]))
                        } else {
                            obj1[key] = merge(obj1[key], obj2[key])
                        }
                        break
                    default:
                        obj1[key] = obj2[key]
                        break
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
        if (isObject(obj2)) {
            if (isObject(obj1)) {
                Object.keys(obj2).forEach(key => {
                    if (!(key in obj1)) {
                        obj1[key] = obj2[key]
                    } else {
                        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
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
 * @param {Object} target 绑定的对象，会将该对象设置为回调函数的this，该对象下必须包含watchs属性
 */
export function batchWatch(target) {
    if (isType(target, 'object') && Array.isArray(target.watchs)) {
        if (!Array.isArray(this.__batchWatchs__)) {
            this.__batchWatchs__ = []
        }
        let index = this.__batchWatchs__.findIndex(item => item.target === target)
        if (index > -1) {
            this.__batchWatchs__[index].unwatch.forEach(unwatch => unwatch())
            this.__batchWatchs__.splice(index, 1)
        }
        let watch = {
            target,
            unwatch: []
        }
        target.watchs.forEach(({ expOrFn, callback, options, context }) => {
            let unwatch = context.$watch(expOrFn, function (newVal, oldVal) {
                callback.call(target, newVal, oldVal)
            }, {
                immediate: true,
                ...options
            })
            watch.unwatch.push(unwatch)
        })
        this.__batchWatchs__.push(watch)
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
export function filterObject(obj, params, configs) {
    return configs.findIndex(config => {
        let value1 = obj[config.dataKey || config.prop]
        let value2 = params[config.prop]
        if (typeof config.filter === 'function') {
            return !config.filter(obj)
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
}
export function filterList(list, params, configs) {
    if (Array.isArray(list)) {
        return list.filter(item => {
            return filterObject(item, params, configs)
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
        script.onload = function (result) {
            console.log(result)
        }
        script.onerror = reject
        head.appendChild(script)
    })
}
/**
 * 获取指定组件名称的props列表
 * @param {Object} context 当前实例上下文
 * @param {String} tag 组件标签名称
 */
export function getComponentProps(context, tag) {
    let components = context.$options.components
    let res = components[tag] || components[hyphenationToCamel(tag)] || components[hyphenationToCamel(tag, false, true)]
    if (res && isType(res.options.props, 'object')) {
        return Object.keys(res.options.props)
    }
    return []
}
/**
 * Promise队列
 * @param {Array} queues 队列列表
 */
export function promiseQueue(queues) {
    let sequence = Promise.resolve()
    queues.forEach(item => {
        sequence = sequence.then(item)
    })
    return sequence
}

// 过滤空参数（undefined，null，空字符串）和首字母为（_）的参数
export function filterEmptyParams(params) {
    if (isType(params, 'object')) {
        params = JSON.parse(JSON.stringify(params))
        Object.keys(params).forEach(key => {
            if ([
                '',
                'null',
                'undefined',
                null,
                void 0
            ].includes(params[key]) || /^_/.test(key)) {
                delete params[key]
            }
        })
    }
    return params
}

// Promise方式setTimeout
export function setTimeout2Promise(func, time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            func()
            resolve()
        }, time)
    })
}
/**
 * 友好时间，秒转换为时分秒
 * @param value 需要的时间（单位：秒）
 */
export function friendlyTime(value) {
    let day = Math.floor(value / 86400)
    let hour = Math.floor(value % 86400 / 3600)
    let minute = Math.floor(value % 86400 % 3600 / 60)
    let second = Math.floor(value % 86400 % 3600 % 60)
    let str = ''
    if (day > 0) {
        str += day + '天'
    }
    if (hour > 0) {
        str += (str ? numberPad(hour) : hour) + '小时'
    }
    if (minute > 0) {
        str += (str ? numberPad(minute) : minute) + '分' + (second > 0 ? '' : '钟')
    }
    if (second > 0) {
        str += (str ? numberPad(second) : second) + '秒'
    }
    return str || '- -'
}
// rem转px
export function remToPx(rem) {
    return document.documentElement.clientHeight / 1080 * rem
}
