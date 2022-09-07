<!--
* @description 选择器输入框
* @author yc
!-->
<template>
    <div
        class="sy-picker-input"
        @click="$emit('picker-input-click', $event)"
    >
        <el-input
            v-bind="props"
            :clearable="false"
            @clear="$emit('clear', $event)"
            @input="$emit('input', $event)"
            @change="$emit('change', $event)"
        >
            <span
                v-if="!props.disabled && props.clearable && !isEmpty(props.value)"
                slot="suffix"
                class="clear el-input__icon el-icon-circle-close"
                @click="handelClear"
            />
            <slot name="prepend" slot="prepend" />
            <slot name="append" slot="append" />
        </el-input>
        <slot name="button" v-if="button">
            <el-button
                v-if="!props.disabled"
                type="primary"
                class="picker-button"
                :size="props.size"
                :icon="buttonIcon"
                :loading="props.loading"
                @click.stop="handleActive"
            >{{ buttonText }}</el-button>
        </slot>
    </div>
</template>
<script>
    // 方法
    import {
        isType,
        isEmpty,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件

    const NAME = 'sy-picker-input'
    const booleanKeys = [
        'showWordLimit',
        'clearable',
        'showPassword',
        'disabled',
        'autofocus',
        'validateEvent'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 绑定值
            value: null,
            // 当value为对象时，用于获取指定属性名的值作为展示
            labelKey: { type: String, default: 'label' },
            // 是否显示按钮
            button: { type: Boolean, default: true },
            // 按钮图标
            buttonIcon: String,
            // 按钮文本
            buttonText: { type: String, default: '选' },
            // 前提配置，点击按钮时只有满足条件发出点击事件
            premises: Array,
            // 发出点击事件之前的钩子，若返回 false 或者返回 Promise 且被 reject，则不会显示窗口
            beforePicker: Function,
            // 绑定对象
            bindObject: Object
        }, NAME),
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return {
                    readonly: true,
                    ...props,
                    value: this.getInputValue()
                }
            }
        },
        methods: {
            isEmpty,
            getInputValue(value = this.value) {
                switch (isType(value)) {
                case 'array':
                    return value.map(this.getInputValue).join('，')
                case 'object':
                    return value[this.labelKey]
                }
                return value
            },
            handelClear() {
                this.$emit('input', '')
                this.$emit('clear')
            },
            async handleActive($event) {
                if (Array.isArray(this.premises) && this.bindObject) {
                    let pass = true
                    this.premises.every(premise => {
                        let value = this.bindObject[premise.prop]
                        if (premise.required !== false && isEmpty(value)) {
                            this.$message.warning(premise.message || `${premise.prop}不能为空`)
                            return (pass = false)
                        }
                        return true
                    })
                    if (!pass) return
                }
                if (typeof this.beforePicker === 'function') {
                    let beforePicker = this.beforePicker(this)
                    if (isPromise(beforePicker)) await beforePicker
                    else if (beforePicker === false) return
                }
                this.$emit('click', $event)
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-picker-input {
    display: flex;
    align-items: flex-start;
    &:hover {
        .clear {
            opacity: 1;
        }
    }
    .clear {
        opacity: 0;
        font-size: 14px;
        transition: .2s;
        vertical-align: middle;
        cursor: pointer;
        &:hover {
            color: #666;
        }
    }
    .el-input {
        flex: 1;
    }
    ::v-deep {
        .el-input__inner {
            border-radius: 4px 0 0 4px;
        }
        .el-input-group__prepend {
            & + .el-input__inner {
                border-radius: 0;
            }
        }
        .picker-button {
            border-radius: 0 4px 4px 0;
        }
        .el-input--mini,
        .el-button--mini {
            height: 28px;
        }
    }
}
</style>
