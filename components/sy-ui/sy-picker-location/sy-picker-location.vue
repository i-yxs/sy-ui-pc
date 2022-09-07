<!--
* @description 地图位置选择器
* @author yc
!-->
<template>
    <div class="sy-picker-location">
        <sy-picker-input
            v-bind="props"
            :readonly="readonly"
            :disabled="disabled"
            :bindObject="bindObject"
            @input="$emit('input', $event)"
            @clear="handelClear"
            @click="handleActive"
            @picker-input-click="handlePickerInputClick"
        >
            <slot name="prepend" slot="prepend" />
            <slot name="append" slot="append" />
        </sy-picker-input>
        <sy-picker-location-dialog
            v-bind="dialogProps_"
            :visible.sync="dialogVisible"
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

    const NAME = 'sy-picker-location'
    const booleanKeys = []

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 窗口标题
            title: String,
            // 绑定值
            value: null,
            // 从选择的数据内获取value的属性名
            valueKey: { type: String, default: 'address' },
            // 是否可以标多个点
            multiple: Boolean,
            // 是否只读
            readonly: Boolean,
            // 是否禁用
            disabled: Boolean,
            /**
             * 绑定项
             * 对象的prop为从选择的数据内获取值的属性名
             * 对象的value为赋值给bindObject对象的属性名
             */
            bindProps: Object,
            // 绑定对象
            bindObject: Object
        }, NAME),
        data() {
            return {
                dialogProps: {},
                dialogVisible: false
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
                        if (this.readonly || this.disabled) {
                            return this.value
                        }
                        return '选择' + this.props.__formItem__.label
                    }
                }
                return this.title
            },
            value_() {
                if (this.multiple) {
                    // 多选
                    if (Array.isArray(this.value) && this.value.length) {
                        return this.value.filter(value => !isEmpty(value)).map((value, index) => {
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
            dialogProps_() {
                return {
                    title: this.title_,
                    ...this.props,
                    value: this.value_,
                    multiple: this.multiple,
                    readonly: this.readonly,
                    enableMarkerPoint: true,
                    enableDrawPolyline: false,
                    enableDrawPolygons: false,
                    ...this.dialogProps
                }
            }
        },
        methods: {
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
                this.dialogVisible = true
            },
            // 选择完成后触发
            handleChange({ markers }) {
                if (this.multiple) {
                    this.$emit('input', markers.map(marker => {
                        return marker[this.valueKey]
                    }))
                } else {
                    this.$emit('input', markers[0][this.valueKey])
                }
                if (this.isBindProps) {
                    let keys = Object.keys(this.bindProps)
                    if (this.multiple) {
                        let values = []
                        keys.forEach((key, index) => {
                            values[index] = []
                            markers.forEach(marker => {
                                values[index].push(marker[key])
                            })
                        })
                        values.forEach((value, index) => {
                            this.$set(this.bindObject, this.bindProps[keys[index]], value)
                        })
                    } else {
                        markers.forEach(marker => {
                            keys.forEach(key => {
                                this.$set(this.bindObject, this.bindProps[key], marker[key])
                            })
                        })
                    }
                }
                this.$emit('change', markers)
            },
            // 选择器输入框点击时触发
            handlePickerInputClick() {
                if (this.readonly || this.disabled) {
                    this.dialogVisible = true
                    this.dialogProps = {
                        readonly: true
                    }
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
</style>
