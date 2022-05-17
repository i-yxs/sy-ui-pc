<!--
* @description 选择器
* @author yc
!-->
<template>
    <el-select
        v-bind="props"
        @change="_handleChange"
    >
        <el-option
            v-for="(option, index) in options"
            :key="index"
            :label="option[labelKey]"
            :value="option[valueKey]"
        />
    </el-select>
</template>
<script>
    // 方法
    import store from '@/store'
    import {
        isType,
        isEmpty,
        getProperty,
        attrsToProps,
        limitedPromise,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-select'
    const booleanKeys = [
        'multiple',
        'disabled',
        'clearable',
        'collapseTags',
        'filterable',
        'allowCreate',
        'remote',
        'loading',
        'reserveKeyword',
        'popperAppendToBody',
        'automaticDropdown'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 排除的value列表，选项value包含在内时不显示
            exclude: Array,
            // 数据请求配置
            request: [Object, Function],
            // 从options内获取的属性名称
            labelKey: { type: String, default: 'label' },
            valueKey: { type: String, default: 'value' },
            // 默认选中第一项
            defaultFirstOption: Boolean
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
                if (Array.isArray(this.dataToRequest)) {
                    options = this.dataToRequest
                } else {
                    options = getProperty(this.$attrs, 'options')
                    if (typeof options === 'string') {
                        options = getProperty(store, `state.stableData.${options}`)
                    }
                    options = Array.isArray(options) ? options : []
                }
                if (Array.isArray(this.exclude)) {
                    return options.filter(option => {
                        return this.exclude.indexOf(option[this.valueKey]) === -1
                    })
                }
                return options
            }
        },
        watch: {
            type() {
                this.$emit('input')
            },
            exclude() {
                if (this.options.findIndex(option => option[this.valueKey] === this.props.value) === -1) {
                    this._handleChange('')
                }
            },
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
            if (this.defaultFirstOption && this.options.length) {
                this._handleChange(this.options[0][this.valueKey])
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
                    this.dataToRequest = []
                    if (isType(this.request, 'object')) {
                        // 接口地址方式请求数据
                        let data = await this.$request(this.request)
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
            // 获取响应值内的选项数据
            _getDataToResponse(data) {
                switch (isType(data)) {
                case 'array':
                    this.dataToRequest = data
                    this.$nextTick(() => {
                        if (this.defaultFirstOption && this.options.length) {
                            this._handleChange(this.options[0][this.valueKey])
                        }
                    })
                    break
                case 'object':
                    this._getDataToResponse(data.data)
                    break
                }
            },
            // 组件改变时触发
            _handleChange(value) {
                let option = this.options.find(option => option[this.valueKey] === value)
                this.$emit('input', value)
                this.$emit('change', { value, option })
            }
        }
    }
</script>
