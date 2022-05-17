<!--
* @description 开关按钮
* @author yc
!-->
<template>
    <div class="sy-switch">
        <el-switch
            v-bind="props"
            @input="$emit('input', $event)"
            @change="$emit('change', $event)"
        />
        <span class="label">{{ label }}</span>
    </div>
</template>

<script>
    // API
    // 方法
    import {
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps from '../default-props'
    // 组件

    const NAME = 'sy-switch'
    const booleanKeys = [
        'value',
        'disabled',
        'activeValue',
        'inactiveValue',
        'validateEvent'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        computed: {
            label() {
                let {
                    value,
                    activeText_,
                    activeValue,
                    inactiveText_,
                    inactiveValue
                } = this.props
                return [activeText_, inactiveText_][[activeValue, inactiveValue].indexOf(value)] || ''
            },
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return Object.assign(props, {
                    activeText: '',
                    activeText_: props.activeText,
                    inactiveText: '',
                    inactiveText_: props.inactiveText
                })
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-switch {
    display: flex;
    align-items: center;
    .label {
        margin-left: 8px;
    }
}
</style>
