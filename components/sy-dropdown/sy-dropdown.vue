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
        trigger="click"
        size="small"
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
            <slot />
        </el-dropdown-menu>
    </el-dropdown>
</template>
<script>

    import {
        hyphenationToCamel
    } from '../utils'

    const NAME = 'sy-dropdown'

    export default {
        name: hyphenationToCamel(NAME),
        data() {
            return {
                visible: true
            }
        },
        mounted() {
            this.updateVisible()
        },
        updated() {
            this.updateVisible()
        },
        methods: {
            updateVisible() {
                if (Array.isArray(this.$slots.default)) {
                    this.visible = this.$slots.default.findIndex(v => v.tag) > -1
                } else {
                    this.visible = false
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
