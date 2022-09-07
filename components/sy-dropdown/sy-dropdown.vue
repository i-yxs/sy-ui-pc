<!--
* 该组件用于实现当el-dropdown-item全部隐藏时，同时也隐藏el-dropdown
* 当el-dropdown-item有多个且存在判断条件时，el-dropdown的判断条件就会特别复杂，
* 所以本组件利用VUE实例的机制判断插槽数量来决定是否显示el-dropdown，
* 开发者只需要关注el-dropdown-item上的判断条件
* @description 级联选择器
* @author yc
!-->
<template>
    <el-dropdown
        v-if="visible"
        size="small"
        class="sy-dropdown"
        trigger="click"
    >
        <slot name="button">
            <el-button
                size="mini"
                icon="el-icon-more"
                title="操作"
                @click.stop
            />
        </slot>
        <el-dropdown-menu slot="dropdown" class="dropdown-menu">
            <div
                v-for="(option, index) in options_"
                :key="index"
                class="dropdown-item"
                @click="handleOptionClick(option)"
            >
                <el-dropdown-item
                    :icon="option.icon"
                    :divided="option.divided !== false"
                >{{ option[labelKey] }}</el-dropdown-item>
            </div>
            <slot />
        </el-dropdown-menu>
    </el-dropdown>
</template>
<script>

    import {
        get2Function,
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'

    const NAME = 'sy-dropdown'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            value: null,
            scope: Object,
            // 选项数据
            options: Array,
            // 排除的value列表，选项value包含在内时不显示
            exclude: Array,
            // 从options内获取的属性名称
            labelKey: { type: String, default: 'label' },
            valueKey: { type: String, default: 'value' },
            // 自定义权限检查函数
            checkAccessMethod: Function
        }, NAME),
        data() {
            return {
                visible: true
            }
        },
        computed: {
            options_() {
                let options = []
                if (Array.isArray(this.options)) {
                    options = this.options.filter(this.getOptionVisible)
                }
                if (Array.isArray(this.exclude)) {
                    options = options.filter(option => {
                        return this.exclude.indexOf(option[this.valueKey]) === -1
                    })
                }
                return options
            }
        },
        mounted() {
            this.updateVisible()
        },
        updated() {
            this.updateVisible()
        },
        methods: {
            // 更新组件可见状态
            updateVisible() {
                this.visible = Array.isArray(this.options) && this.options_.length || Array.isArray(this.$slots.default) && this.$slots.default.findIndex(v => v.tag) > -1
            },
            // 获取选项可见状态
            getOptionVisible(option) {
                let { visible, accessKey } = option
                if (get2Function(visible, this.scope) !== false) {
                    if (typeof this.checkAccessMethod === 'function') {
                        accessKey = get2Function(accessKey, this.scope)
                        if (accessKey) return this.checkAccessMethod(accessKey)
                    }
                    return true
                }
                return false
            },
            // 选项点击时触发
            handleOptionClick(option) {
                this.$emit('input', option[this.valueKey])
                this.$emit('change', option)
                if (this.$listeners.click) {
                    this.$emit('click', option)
                } else {
                    get2Function(option.onClick, this.scope)
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.dropdown-menu {
    ::v-deep {
        .dropdown-item {
            &:first-child {
                .el-dropdown-menu__item--divided{
                    margin-top: 0;
                    border-top: none;
                    &::before {
                        display: none;
                    }
                }
            }
        }
    }
}
</style>
