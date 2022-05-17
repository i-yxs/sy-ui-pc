<!--
* @description 地图位置选择器窗口
* @author yc
!-->
<template>
    <sy-dialog
        :title="title"
        :width="width_"
        :visible="visible"
        :fullscreen="fullscreen"
        :beforeCloseAsking="!readonly"
        :closeOnClickModal="false"
        @update:visible="$emit('update:visible', false)"
    >
        <div class="sy-picker-location-dialog" :style="{height: height_}">
            <sy-baidu-map
                ref="syBaiduMap"
                v-bind="props"
                :readonly="readonly"
            />
        </div>
        <span slot="footer" v-if="!readonly">
            <el-button size="mini" @click="$emit('update:visible', false)">取 消</el-button>
            <el-button type="primary" size="mini" @click="handleConfirm">确 定</el-button>
        </span>
    </sy-dialog>
</template>
<script>
    // 方法
    import {
        isPromise,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-picker-location-dialog'
    const booleanKeys = []

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 选中项
            value: Array,
            // 窗口标题
            title: String,
            // 窗口宽度
            width: { type: String, default: '90vw' },
            // 窗口高度
            height: { type: String, default: '80vh' },
            // 窗口可见状态
            visible: Boolean,
            // 是否只读
            readonly: Boolean,
            // 窗口是否全屏显示
            fullscreen: Boolean,
            // 确定前的钩子
            beforeConfirm: Function
        }, NAME),
        data() {
            return {
                markers: []
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return {
                    ...props,
                    markers: this.markers
                }
            },
            width_() {
                return this.fullscreen ? '100%' : this.width
            },
            height_() {
                return this.fullscreen ? '100%' : this.height
            }
        },
        watch: {
            visible(visible) {
                if (visible) {
                    this.init()
                }
            }
        },
        mounted() {
            this.init()
        },
        methods: {
            // 初始化组件
            init() {
                this.markers = JSON.parse(JSON.stringify(this.value))
            },
            // 点击确定按钮时触发
            async handleConfirm() {
                let map = this.$refs.syBaiduMap
                if (typeof this.beforeConfirm === 'function') {
                    let beforeConfirm = this.beforeConfirm(map.drawObject)
                    if (isPromise(beforeConfirm)) {
                        await beforeConfirm
                    } else if (beforeConfirm === false) return
                }
                this.$emit('change', map.drawObject)
                this.$emit('update:visible', false)
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-picker-location-dialog {
    height: 100%;
    overflow: hidden;
}
</style>
