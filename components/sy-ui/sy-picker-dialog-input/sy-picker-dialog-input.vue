<!--
* @description 窗口选择器
* @author yc
!-->
<template>
    <div class="sy-picker-dialog-input">
        <sy-picker-input
            v-bind="props"
            :bindObject="bindObject"
            @input="handleInput"
            @clear="handelClear"
            @click="handleActive"
            @change="$emit('change', $event)"
        >
            <slot name="prepend" slot="prepend" />
            <slot name="append" slot="append" />
        </sy-picker-input>
        <sy-picker-dialog
            :visible.sync="pickerDialog.visible"
            v-bind="dialogProps"
            :remMode="remMode"
            @change="handleChange"
        />
    </div>
</template>
<script>
    // 方法
    import {
        isEmpty,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件

    const NAME = 'sy-picker-dialog-input'
    const booleanKeys = [
        'readonly'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 窗口标题
            title: String,
            // 绑定值
            value: null,
            // rem模式
            remMode: Boolean,
            // 从选择的数据内获取value的属性名
            valueKey: { type: String, default: 'id' },
            // 自定义上下文
            context: Object,
            // 最大可选数量
            maxCount: Number,
            // 排除项
            excludes: Array,
            // 是否多选
            multiple: Boolean,
            /**
             * 绑定项
             * 对象的prop为从选择的数据内获取值的属性名
             * 对象的value为赋值给bindObject对象的属性名
             */
            bindProps: Object,
            // 绑定对象
            bindObject: Object,
            // 表格配置
            tableProps: [Object, String, Array]
        }, NAME),
        data() {
            return {
                pickerDialog: {
                    visible: false
                }
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                let value = Array.isArray(this.value) ? this.value.join(',') : this.value
                return {
                    readonly: true,
                    ...props,
                    value
                }
            },
            title_() {
                if (isEmpty(this.title)) {
                    if (!isEmpty(this.props.__formItem__)) {
                        return '选择' + this.props.__formItem__.label
                    }
                }
                return this.title
            },
            value_() {
                if (this.multiple) {
                    // 多选
                    if (Array.isArray(this.value) && this.value.length) {
                        return this.value.map((value, index) => {
                            let row = {
                                [this.valueKey]: value
                            }
                            if (this.isBindProps) {
                                Object.keys(this.bindProps).forEach(key => {
                                    let bindValue = this.bindObject[this.bindProps[key]]
                                    if (Array.isArray(bindValue)) {
                                        row[key] = bindValue[index]
                                    }
                                })
                            }
                            return row
                        })
                    }
                    return []
                } else {
                    // 单选
                    if (isEmpty(this.value)) return []
                    let row = {
                        [this.valueKey]: this.value
                    }
                    if (this.isBindProps) {
                        Object.keys(this.bindProps).forEach(key => {
                            row[key] = this.bindObject[this.bindProps[key]]
                        })
                    }
                    return [row]
                }
            },
            isBindProps() {
                return !isEmpty(this.bindProps) && !isEmpty(this.bindObject)
            },
            dialogProps() {
                return {
                    title: this.title_,
                    value: this.value_,
                    width: this.props.width,
                    height: this.props.height,
                    multiple: this.multiple,
                    maxCount: this.maxCount,
                    tableProps: this.tableProps
                }
            }
        },
        watch: {
        },
        mounted() {
        },
        methods: {
            // 输入时触发
            handleInput(value) {
                if (this.isBindProps) {
                    Object.values(this.bindProps).forEach(key => {
                        this.$set(this.bindObject, key, this.multiple ? [] : '')
                    })
                }
                this.$emit('input', value)
            },
            // 清空时触发
            handelClear() {
                if (this.isBindProps) {
                    Object.values(this.bindProps).forEach(key => {
                        this.$set(this.bindObject, key, this.multiple ? [] : '')
                    })
                }
                this.$emit('clear')
            },
            // 点击按钮时触发
            handleActive() {
                this.pickerDialog.visible = true
            },
            // 选择完成后触发
            handleChange(rows) {
                if (this.multiple) {
                    this.$emit('input', rows.map(row => {
                        return row[this.valueKey]
                    }))
                } else {
                    this.$emit('input', rows[0][this.valueKey])
                }
                if (this.isBindProps) {
                    let keys = Object.keys(this.bindProps)
                    if (this.multiple) {
                        let values = []
                        keys.forEach((key, index) => {
                            values[index] = []
                            rows.forEach(row => {
                                values[index].push(row[key])
                            })
                        })
                        values.forEach((value, index) => {
                            this.$set(this.bindObject, this.bindProps[keys[index]], value)
                        })
                    } else {
                        rows.forEach(row => {
                            keys.forEach(key => {
                                this.$set(this.bindObject, this.bindProps[key], row[key])
                            })
                        })
                    }
                }
                this.$emit('change', rows)
            }
        }
    }
</script>

<style lang='scss' scoped>
</style>
