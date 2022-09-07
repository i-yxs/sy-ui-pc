<!--
* @description 输入框
* @author yc
!-->
<template>
    <el-input
        v-on="listeners_"
        v-bind="props"
        :value="value_"
        class="sy-input"
        :class="`align-${align}`"
        @blur="_handleBlur"
        @focus="_handleFocus"
        @input="_handleInput"
        @change="_handleChange"
    >
        <slot slot="prefix" name="prefix" />
        <slot slot="suffix" name="suffix" />
        <slot slot="prepend" name="prepend" />
        <slot slot="append" name="append" />
    </el-input>
</template>
<script>
    // 方法
    import {
        isEmpty,
        getProperty,
        attrsToProps,
        toLocaleString,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件

    const NAME = 'sy-input'
    const booleanKeys = [
        'disabled',
        'readonly',
        'autosize',
        'clearable',
        'autofocus',
        'showPassword',
        'showWordLimit',
        'validateEvent'
    ]
    const numberReg = /^[\d\.\+\-]+$/

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            value: null,
            // 允许的最小值
            min: [Number, String],
            // 允许的最大值
            max: [Number, String],
            // 文本框对齐方式
            align: { type: String, default: 'left' },
            // 精度
            precision: [Number, String],
            // 头部文本
            prefixText: { type: String, default: '' },
            // 尾部文本
            suffixText: { type: String, default: '' },
            // 数值模式，未获得焦点时value将使用toLocaleString格式化
            numberMode: Boolean
        }, NAME),
        data() {
            return {
                focus: false,
                value_: '',
                value2Number: ''
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                if (this.numberMode) {
                    props.type = this.focus ? 'number' : 'text'
                }
                return props
            },
            listeners_() {
                let listeners_ = {}
                Object.keys(this.$listeners).filter(name => ['input', 'change'].indexOf(name) === -1).forEach(name => {
                    listeners_[name] = this.$listeners[name]
                })
                return listeners_
            }
        },
        watch: {
            min: '_updateValue',
            max: '_updateValue',
            value: 'setValue',
            '$attrs.emptyValue': '_updateValue'
        },
        mounted() {
            this._updateValue()
        },
        methods: {
            // 设置value
            setValue(value) {
                let fixValue = this.getFixValue(value)
                if (fixValue !== value) {
                    this.$emit('input', fixValue)
                    this.$emit('change', fixValue)
                } else {
                    this.value_ = fixValue
                    // 根据当前获得焦点状态更新value
                    if (this.focus) {
                        this._handleFocus()
                    } else {
                        this._handleBlur()
                    }
                }
            },
            // 获取修正后value
            getFixValue(value) {
                // value为空时，如果有配置emptyValue，则将value设置为emptyValue
                if (isEmpty(value) || isNaN(value)) {
                    if ('emptyValue' in this.$attrs) {
                        let { emptyValue } = this.$attrs
                        if (value !== emptyValue) {
                            value = emptyValue
                        }
                    }
                }
                // 限制最小值、最大值、精度
                if (numberReg.test(value)) {
                    let minValid = numberReg.test(this.min)
                    let maxValid = numberReg.test(this.max)
                    let precisionValid = numberReg.test(this.precision)
                    if (minValid || maxValid || precisionValid) {
                        if (minValid && value < this.min) {
                            value = this.min
                        }
                        if (maxValid && value > this.max) {
                            value = this.max
                        }
                        if (precisionValid && getProperty(String(value).split('.'), '1.length') > this.precision) {
                            value = Number(Number(value).toFixed(this.precision))
                        }
                    }
                }
                return value
            },
            // 更新value
            _updateValue() {
                this.setValue(this.value)
            },
            // 失去焦点时触发
            _handleBlur() {
                this.focus = false
                let value = this.value_
                //  数字模式处理
                if (this.numberMode) {
                    if (numberReg.test(value)) {
                        value = toLocaleString(value, 0, 16)
                    } else {
                        value = ''
                    }
                }
                value = isEmpty(value) ? '' : value
                this.value_ = this.prefixText + value + this.suffixText
            },
            // 获得焦点时触发
            _handleFocus() {
                this.focus = true
                this.value_ = this.value
            },
            // 输入时触发
            _handleInput(value) {
                let fixValue = this.getFixValue(value)
                if (fixValue === value) {
                    // 只有当输入值和修正值相同时才触发input事件
                    this.$emit('input', value)
                }
                this.value_ = value
            },
            // 改变时触发
            _handleChange() {
                let value = this.value_
                let fixValue = this.getFixValue(value)
                if (fixValue !== value) {
                    this.value_ = fixValue
                    this.$emit('input', fixValue)
                    this.$emit('change', fixValue)
                } else {
                    this.$emit('change', value)
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-input {
    &.align-left {
        ::v-deep {
            input {
                text-align: left;
            }
        }
    }
    &.align-center {
        ::v-deep {
            input {
                text-align: center;
            }
        }
    }
    &.align-right {
        ::v-deep {
            input {
                text-align: right;
            }
        }
    }
}
</style>
