<!--
* @description 级联选择器
* @author yc
!-->
<template>
    <el-cascader
        v-if="options"
        v-bind="props"
        @input="$emit('input', $event)"
        @change="_handleChange"
    />
</template>
<script>
    // 方法
    import store from '@/store'
    import {
        isType,
        isEmpty,
        getTreeNode,
        getProperty,
        attrsToProps,
        limitedPromise,
        differenceMerge,
        clearEmptyArray,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件

    const NAME = 'sy-cascader'
    const booleanKeys = [
        'disabled',
        'clearable',
        'showAllLevels',
        'collapseTags',
        'filterable'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 数据最大显示深度
            deep: [Number, String],
            // 数据请求配置
            request: [Object, Function]
        }, NAME),
        data() {
            return {
                loading: false,
                dataToRequest: null
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                if (isType(this.request, 'object')) {
                    props.loading = this.loading
                }
                props.options = this.options
                return props
            },
            options() {
                let options = []
                if (this.request) {
                    options = this.dataToRequest
                } else {
                    options = getProperty(this.$attrs, 'options')
                    if (typeof options === 'string') {
                        options = getProperty(store, `state.stableData.${options}`)
                    }
                    options = Array.isArray(options) ? options : []
                }
                return this._getOptionsToDeep(options)
            }
        },
        watch: {
            request: {
                deep: true,
                handler() {
                    this._requestData()
                }
            }
        },
        mounted() {
            if (!isEmpty(this.request)) {
                this._requestData()
            }
        },
        methods: {
            // 根据请求配置获取选项数据
            async _requestData() {
                if (isType(this.request, 'object') && !isType(this.$request, 'function')) {
                    return console.error('请在vue原型链中注入$request请求方法')
                }
                try {
                    this.loading = true
                    /**
                     * 用于解决el-cascader的options数据变化时会导致组件内部报错的问题;
                     * dataToRequest为null时不会渲染el-cascader组件
                     */
                    this.dataToRequest = null
                    this.$nextTick(() => {
                        this.dataToRequest = []
                    })
                    if (isType(this.request, 'object')) {
                        // 接口地址方式请求数据
                        let data = await limitedPromise(this.$request(this.request))
                        this._getDataToResponse(data)
                    } else {
                        // 自定义函数，自定义函数返回值必须是Promise对象
                        let data = await limitedPromise(this.request())
                        this._getDataToResponse(data)
                    }
                } catch (err) {
                    console.error(err)
                }
                this.loading = false
            },
            // 根据指定深度获取选项数据
            _getOptionsToDeep(options) {
                let maxDeep = Number(this.deep)
                if (maxDeep) {
                    let childrenKey = getProperty(this.$attrs, 'props.childrenKey') || 'children'
                    let recursion = (children, deep) => {
                        if (Array.isArray(children)) {
                            return children.map(node => {
                                node = { ...node }
                                if (deep < maxDeep) {
                                    node[childrenKey] = recursion(node[childrenKey], deep + 1)
                                } else {
                                    node[childrenKey] = null
                                }
                                return node
                            })
                        }
                        return []
                    }
                    return recursion(options, 1)
                }
                return options
            },
            // 获取响应值内的选项数据
            _getDataToResponse(data) {
                switch (isType(data)) {
                case 'array':
                    clearEmptyArray({
                        data,
                        childrenKey: getProperty(this.props, 'props.childrenKey')
                    })
                    this.dataToRequest = data
                    break
                case 'object':
                    this._getDataToResponse(data.data)
                    break
                }
            },
            // 组件改变时触发
            _handleChange(value) {
                let nodes = getTreeNode({
                    data: this.options,
                    value,
                    valueKey: getProperty(this.props, 'props.value') || 'value',
                    childrenKey: getProperty(this.props, 'props.children') || 'children'
                })
                this.$emit('change', { value, nodes })
            }
        }
    }
</script>
