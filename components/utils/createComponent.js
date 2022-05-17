
import Vue from 'vue'
import store from '@/store'
import router from '@/router'
import {
    isType,
    deepMerge
} from './index'

var config = {}
try {
    config = require('@/detailConfig').default
} catch (err) {
    console.warn('未找到"detailConfig/index.js"文件')
}
/**
 * 使用配置项生成组件并插入到html文档中
 * @param {Object} options 选项配置
 * @param {Object, String} component 组件实例or组件配置名称
 * @param {Object} attribute 同createElement函数的第二参数
 * @param {Object} parentNode 父节点
 */

export default function createComponent(options) {
    options = {
        component: null,
        attribute: {},
        parentNode: document.body,
        ...options
    }
    let props = {}
    let component = options.component
    if (isType(component, 'string')) {
        if (component in config) {
            component = config[component]
            if (Array.isArray(component)) {
                props = component[1]
                component = component[0]
            }
        } else {
            return console.error(`不存在“${component}”类型，请在“detailConfig/index.js”配置该类型`)
        }
    }
    let el = document.createElement('div')
    let constructor = Vue.component('createElement', {
        render: (createElement) => createElement('div')
    })
    document.body.appendChild(el)
    return new constructor({
        el,
        store,
        router,
        data() {
            return {
                visible: false
            }
        },
        components: {
            createElement: component
        },
        render(createElement) {
            let attribute = deepMerge(options.attribute, {
                props: {
                    ...props,
                    visible: this.visible
                },
                on: {
                    closed: () => {
                        clearTimeout(this.timer)
                        this.$destroy()
                    },
                    'update:visible': (visible) => {
                        this.visible = visible
                        if (!visible) {
                            // 设置计时器，防止组件一直没有触发closed事件，导致组件不会销毁，造成内存溢出的问题
                            this.timer = setTimeout(() => {
                                this.$destroy()
                            }, 1000)
                        }
                    }
                }
            })
            return createElement('createElement', attribute)
        },
        mounted() {
            this.visible = true
        }
    })
}
