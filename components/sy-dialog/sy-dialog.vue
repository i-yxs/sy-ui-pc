<!--
* @description 对话框
* @author yc
!-->
<template>
    <el-dialog
        v-bind="props"
        :visible="visible"
        class="sy-dialog"
        @closed="_handleClosed"
    >
        <slot slot="title" name="title" />
        <div v-loading="loading" class="sy-dialog-content">
            <div class="content" :style="contentStyle_">
                <slot v-if="contentVisible" />
            </div>
        </div>
        <slot slot="footer" name="footer">
            <el-button size="mini" @click="_handleClose">关 闭</el-button>
        </slot>
    </el-dialog>
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
    const NAME = 'sy-dialog'
    const booleanKeys = [
        'modal',
        'center',
        'visible',
        'showClose',
        'fullscreen',
        'lockScroll',
        'appendToBody',
        'destroyOnClose',
        'closeOnClickModal',
        'closeOnPressEscape',
        'modalAppendToBody'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            height: String,
            visible: Boolean,
            loading: Boolean,
            // 自定义内容元素样式
            contentStyle: Object,
            // 询问文本
            askingText: { type: String, default: '确认放弃本次操作？' },
            // 关闭前询问是否关闭
            beforeCloseAsking: { type: Boolean, default: true }
        }, NAME),
        data() {
            return {
                contentVisible: true
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return {
                    width: '800px',
                    beforeClose: this._handleBeforeClose,
                    appendToBody: true,
                    closeOnClickModal: false,
                    ...props,
                    // destroyOnClose设置为true时，关闭dialog可能会卡死页面
                    destroyOnClose: false
                }
            },
            contentStyle_() {
                return {
                    height: this.height,
                    ...this.contentStyle
                }
            }
        },
        watch: {
            visible(value) {
                if (value) {
                    this.contentVisible = true
                }
            }
        },
        mounted() {
            this.contentVisible = this.visible
        },
        methods: {
            // 点击关闭按钮时触发
            _handleClose() {
                this.$emit('close')
                this.$emit('update:visible', false)
            },
            // 关闭动画结束时触发
            _handleClosed() {
                this.contentVisible = false
                this.$emit('closed')
            },
            // 关闭前触发
            _handleBeforeClose() {
                if (this.beforeCloseAsking) {
                    this.$confirm(this.askingText).then(_ => {
                        this._handleClose()
                    })
                } else {
                    this._handleClose()
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-dialog {
    .sy-dialog-content {
        height: 100%;
        .content {
            height: 100%;
            overflow: auto;
        }
    }
    ::v-deep {
        .el-dialog__body {
            padding: 0 !important;
        }
    }
}
</style>
