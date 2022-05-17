<!--
* @description 拖拽调整大小容器
* @author yc
!-->
<template>
    <div
        class="sy-resize"
        :style="{
            width: width + 'px',
            height: height + 'px'
        }"
    >
        <div class="content">
            <slot />
        </div>
        <div
            v-for="type in sliders"
            :key="type"
            class="slider"
            :class="type"
            :style="{
                transform: `${['top', 'bottom'].includes(type) ? `translateY(${offsetY})` : ['left', 'right'].includes(type) ? `translateX(${offsetX})` : ''}`
            }"
            title="拖拽调整大小"
            @mousedown="handleMousedown($event, type)"
        />
    </div>
</template>

<script>
    // 方法
    import {
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-resize'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            width: [String, Number],
            height: [String, Number],
            // 指定各个方位是否可调整大小
            top: Boolean,
            left: Boolean,
            right: Boolean,
            bottom: Boolean,
            // 拖拽条偏移值
            offsetX: String,
            offsetY: String,
            // 最小/最大可调整的宽度/高度
            minWidth: [String, Number],
            maxWidth: [String, Number],
            minHeight: [String, Number],
            maxHeight: [String, Number]
        }, NAME),
        computed: {
            sliders() {
                let sliders = []
                if (this.top) sliders.push('top')
                if (this.left) sliders.push('left')
                if (this.right) sliders.push('right')
                if (this.bottom) sliders.push('bottom')
                return sliders
            }
        },
        mounted() {
            window.addEventListener('mousemove', this.handleMousemove)
            window.addEventListener('mouseup', this.handleMouseup)
        },
        beforeDestroy() {
            window.removeEventListener('mousemove', this.handleMousemove)
            window.removeEventListener('mouseup', this.handleMouseup)
        },
        methods: {
            handleMousedown(e, type) {
                this.mouse = {
                    x: e.clientX,
                    y: e.clientY,
                    type,
                    objectWidth: this.$el.clientWidth,
                    objectHeight: this.$el.clientHeight
                }
            },
            handleMousemove(e) {
                if (this.mouse) {
                    let minWidth = this.minWidth || this.width
                    let maxWidth = this.maxWidth || this.width
                    let minHeight = this.minHeight || this.height
                    let maxHeight = this.maxHeight || this.height
                    switch (this.mouse.type) {
                    case 'top':
                        this.$el.style.height = Math.min(Math.max(this.mouse.y - e.clientY + this.mouse.objectHeight, minHeight), maxHeight) + 'px'
                        break
                    case 'left':
                        this.$el.style.width = Math.min(Math.max(this.mouse.x - e.clientX + this.mouse.objectWidth, minWidth), maxWidth) + 'px'
                        break
                    case 'right':
                        this.$el.style.width = Math.min(Math.max(e.clientX - this.mouse.x + this.mouse.objectWidth, minWidth), maxWidth) + 'px'
                        break
                    case 'bottom':
                        this.$el.style.height = Math.min(Math.max(e.clientY - this.mouse.y + this.mouse.objectHeight, minHeight), maxHeight) + 'px'
                        break
                    }
                }
            },
            handleMouseup() {
                if (this.mouse) {
                    this.mouse = null
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-resize {
    position: relative;
    width: 100%;
    height: 100%;
    .content {
        position: relative;
        z-index: 1;
        height: 100%;
        overflow: auto;
    }
    .slider {
        position: absolute;
        user-select: none;
        z-index: 2;
        transition: background .2s ease-in-out;
        &.top,
        &.bottom {
            left: 0;
            right: 0;
            height: 10px;
            cursor: ns-resize;
        }
        &.left,
        &.right {
            top: 0;
            bottom: 0;
            width: 10px;
            cursor: ew-resize;
        }
        &.top {
            top: 0;
        }
        &.bottom {
            bottom: 0;
        }
        &.left {
            left: 0;
        }
        &.right {
            right: 0;
        }
    }
}
</style>
