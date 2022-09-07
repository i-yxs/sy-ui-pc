<!--
* @description 单选按钮
* @author yc
!-->
<template>
    <div class="sy-radio">
        <el-radio-group
            v-bind="props"
            :class="{'is-button': button}"
            @input="$emit('input', $event)"
            @change="$emit('change', $event)"
        >
            <template v-if="button">
                <el-radio-button
                    v-for="(option, index) in options_"
                    :key="index"
                    :size="props.size"
                    :name="option.name"
                    :label="option[valueKey]"
                    :border="props.border"
                    :disabled="option.disabled"
                >
                    {{ option[labelKey] }}
                </el-radio-button>
            </template>
            <template v-else>
                <el-radio
                    v-for="(option, index) in options_"
                    :key="index"
                    :size="props.size"
                    :name="option.name"
                    :label="option[valueKey]"
                    :border="props.border"
                    :disabled="option.disabled"
                >
                    {{ option[labelKey] }}
                </el-radio>
            </template>
        </el-radio-group>
    </div>
</template>

<script>
    // 方法
    import store from '@/store'
    import {
        getProperty,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件

    const NAME = 'sy-radio'
    const booleanKeys = [
        'value',
        'label',
        'border',
        'disabled'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 是否按钮样式
            button: Boolean,
            // 数据源
            options: [Array, String],
            labelKey: { type: String, default: 'label' },
            valueKey: { type: String, default: 'value' }
        }, NAME),
        computed: {
            props() {
                return differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
            },
            options_() {
                let options = this.options
                if (typeof options === 'string') {
                    options = getProperty(store, `state.stableData.${options}`)
                }
                options = Array.isArray(options) ? options : []
                return options.filter(v => v.visible !== false)
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-radio {
    display: inline-block;
    vertical-align: middle;
    ::v-deep {
        .el-radio__inner {
            vertical-align: top;
        }
        .el-radio__label {
            vertical-align: middle;
        }
        .el-radio-group {
            margin-top: -12px;
            &.is-button {
                margin-top: 0;
            }
        }
        .el-radio{
            margin-left: 0 !important;
            margin-right: 12px;
            margin-top: 12px;
            &.is-disabled {
                &.is-checked {
                    .el-radio__label {
                        color: #409EFF;
                    }
                    .el-radio__inner {
                        border-color: #409EFF;
                        background: #409EFF;
                        &::after {
                            background: #fff;
                        }
                    }
                }
            }
        }
        .el-radio-button {
            &.is-disabled {
                &.is-active {
                    .el-radio-button__inner {
                        color: #FFF;
                        background-color: #409EFF;
                        border-color: #409EFF;
                        -webkit-box-shadow: -1px 0 0 0 #409eff;
                        box-shadow: -1px 0 0 0 #409eff;
                    }
                }
            }
        }
    }
}
</style>
