<!--
* @description 空状态
* @author yc
!-->
<template>
    <div class="sy-empty">
        <slot name="icon">
            <i class="icon" :class="icon" :style="{fontSize: iconSize}" />
        </slot>
        <div class="text">
            <slot name="text">{{ text }}</slot>
        </div>
        <slot />
    </div>
</template>

<script>
    // 方法
    import {
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-empty'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            icon: { type: String, default: 'el-icon-receiving' },
            text: { type: String, default: '暂无数据' },
            iconSize: { type: String, default: '70px' }
        }, NAME)
    }
</script>

<style lang='scss' scoped>
.sy-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 160px;
    .icon {
        color: #e2e2e2;
        line-height: 1em;
    }
    .text {
        color: #999;
        margin-top: 10px;
        font-size: 14px;
    }
}
</style>
