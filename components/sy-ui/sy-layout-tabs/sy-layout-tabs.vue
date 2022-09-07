<!--
* @description  选项卡布局
* @author yc
!-->
<template>
    <div class="sy-layout-tabs sy-layout flex column">
        <div class="sy-layout">
            <el-tabs
                :value="value"
                :class="{'not-margin': notMargin}"
                class="sy-tabs min-margin"
                @tab-click="handleTabClick"
            >
                <el-tab-pane
                    v-for="item in options"
                    :key="item.name"
                    :name="item.name"
                    :label="item.label"
                />
            </el-tabs>
        </div>
        <div class="sy-layout auto">
            <keep-alive>
                <slot />
            </keep-alive>
        </div>
    </div>
</template>
<script>
    // 工具
    import {
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // API
    // 组件
    const NAME = 'sy-layout-tabs'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            value: { type: String },
            options: { type: Array, default: () => [] },
            notMargin: Boolean
        }, NAME),
        mounted() {
            let { name } = this.$route.query
            if (name) {
                this.$emit('input', name)
            }
        },
        methods: {
            handleTabClick(data) {
                let name = data.name
                this.$emit('input', name)
                this.$emit('change', data)
                history.replaceState(null, null, `${location.origin}${location.pathname || '/'}#${this.$route.path}?name=${name}`)
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-layout-tabs {
    margin-top: -10px;
    height: calc(100% + 10px);
}
</style>
