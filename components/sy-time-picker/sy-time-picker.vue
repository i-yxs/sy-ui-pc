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
            bindItems: Array,
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
                immediate: true,
                handler() {
                    if (this.bindObject && Array.isArray(this.bindItems)) {
                        this.value_ = this.bindItems.map(key => {
                            return this.bindObject[key] || ''
                        })
                    }
                }
            }
        },
        mounted() {
            this.value_ = this.props.value
            this.ready_ = true
        },
        methods: {
            handleChange(value) {
                this.value_ = value
                if (this.bindObject && Array.isArray(this.bindItems)) {
                    if (Array.isArray(value)) {
                        this.bindItems.forEach((key, index) => {
                            this.$set(this.bindObject, key, value[index])
                        })
                    } else {
                        this.bindItems.forEach(key => {
                            this.$set(this.bindObject, key, value)
                        })
                    }
                }
                this.$emit('input', value)
                this.$emit('change', value)
            }
        }
    }
</script>
