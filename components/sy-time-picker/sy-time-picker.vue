<!--
* @description 时间选择器
* @author yc
!-->
<template>
    <el-time-picker
        v-if="ready_"
        v-model="value_"
        v-bind="props"
        @change="handleChange"
    />
</template>
<script>
    // 方法
    import {
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-time-picker'
    const booleanKeys = [
        'readonly',
        'disabled',
        'editable',
        'clearable',
        'unlinkPanels',
        'validateEvent'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            bindProps: Array,
            bindObject: Object
        }, NAME),
        data() {
            return {
                value_: null,
                ready_: false
            }
        },
        computed: {
            props() {
                return differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
            }
        },
        watch: {
            'props.value'(value) {
                this.value_ = value
            },
            bindObject: {
                deep: true,
                handler() {
                    this.updateValue()
                }
            }
        },
        mounted() {
            if (this.bindObject && Array.isArray(this.bindProps)) {
                this.value_ = this.bindProps.map(key => this.bindObject[key] || '')
                /**
                 * 赋值占位prop，清除验证错误信息
                 */
                let { __formItem__ } = this.props
                if (__formItem__) {
                    this.$set(this.bindObject, __formItem__.prop, this.value_)
                }
            } else {
                this.value_ = this.props.value
            }
            this.ready_ = true
        },
        methods: {
            // 更新value
            updateValue() {
                clearTimeout(this.updateTimer)
                this.updateTimer = setTimeout(() => {
                    if (this.bindObject && Array.isArray(this.bindProps)) {
                        let value = this.bindProps.map(key => this.bindObject[key] || '')
                        if (value.toString() !== this.props.value.toString()) {
                            this.$emit('input', value)
                        }
                        this.value_ = value
                    }
                }, 300)
            },
            // 更新bindProps
            updateBindProps() {
                let value = this.value_
                if (this.bindObject && Array.isArray(this.bindProps)) {
                    if (Array.isArray(value)) {
                        this.bindProps.forEach((key, index) => {
                            this.$set(this.bindObject, key, value[index])
                        })
                    } else {
                        this.bindProps.forEach(key => {
                            this.$set(this.bindObject, key, value)
                        })
                    }
                }
            },
            handleChange(value) {
                this.value_ = value
                this.updateBindProps()
                this.$emit('input', value)
                this.$emit('change', value)
            }
        }
    }
</script>
