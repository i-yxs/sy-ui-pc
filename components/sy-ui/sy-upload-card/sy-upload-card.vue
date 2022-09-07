<!--
* @description 上传卡片样式
* @author yc
!-->
<template>
    <div class="sy-upload-card">
        <el-upload
            v-if="showUpload"
            v-bind="props"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-progress="handleUploadProgress"
            :on-error="handleUploadError"
        >
            <div
                class="upload-button"
                :style="cardStyle"
            >
                <i class="icon el-icon-plus" />
                <div class="describe" v-if="describe">{{ describe }}</div>
            </div>
        </el-upload>
        <div
            v-else
            class="upload-wrap"
            :style="cardStyle"
        >
            <div class="error" v-if="uploadStatus === -1">上传失败</div>
            <div class="progress" v-if="uploadStatus === 1">
                <el-progress type="circle" :percentage="uploadProgress" :width="60" :stroke-width="3" />
            </div>
            <div
                v-if="isEmpty(value) && [0, 2].includes(uploadStatus)"
                class="empty"
            >
                <i class="el-icon-picture" />
                <p>{{ emptyText }}</p>
            </div>
            <div
                v-else
                class="image"
                :style="{backgroundImage: `url(${thumbPath})`}"
                @click="handleImageViewer"
            />
            <div class="el-icon-close remove" v-if="allowEdit && uploadStatus !== 1" @click="handleRemove" />
            <div class="describe" v-if="describe">{{ describe }}</div>
        </div>
    </div>
</template>

<script>
    // API
    // 方法
    import {
        isEmpty,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    import Viewer from 'viewerjs'

    const NAME = 'sy-upload-card'
    const booleanKeys = [
        'multiple',
        'withCredentials',
        'showFileList',
        'drag',
        'autoUpload',
        'disabled'
    ]

    /**
     * 文件状态
     * -1：上传失败
     * 0：待选择文件
     * 1：上传中
     * 2：上传成功
     */

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            value: null,
            // 描述文本
            describe: String,
            // 空数据时的显示问题
            emptyText: { type: String, default: '暂无图片' },
            // 是否只读模式
            readonly: Boolean,
            // 卡片样式
            cardStyle: Object,
            // 缩略图地址
            thumbApi: { type: String, default: '/' },
            // 文件原始地址
            originalApi: { type: String, default: '/' },
            // 上传成功后自定义格式化返回值
            formatResponse: Function
        }, NAME),
        data() {
            return {
                /**
                 * 上传状态
                 * -1：上传失败
                 * 0：待上传
                 * 1：上传中
                 * 2：上传成功
                 */
                uploadStatus: 0,
                uploadProgress: 0
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                if (typeof props.headers === 'function') {
                    props.headers = props.headers()
                }
                props.showFileList = false
                return props
            },
            // 是否允许编辑
            allowEdit() {
                return !this.props.disabled && !this.readonly
            },
            // 是否显示上传控件
            showUpload() {
                if (this.allowEdit) {
                    return this.uploadStatus === 0
                }
                return false
            },
            thumbPath() {
                let file = this.value || {}
                return this.thumbApi + file.fileId
            },
            originalPath() {
                let file = this.value || {}
                return this.originalApi + file.fileId
            }
        },
        watch: {
            value: {
                immediate: true,
                handler() {
                    this.uploadStatus = isEmpty(this.value) ? 0 : 2
                }
            }
        },
        mounted() {
            this.$viewerElement = document.createElement('div')
            this.$viewer = new Viewer(this.$viewerElement)
        },
        methods: {
            isEmpty,
            // 校验所有文件是否上传完成
            validateUploadComplete() {
                switch (this.uploadStatus) {
                case 1:
                    this.$message('有文件正在上传中')
                    return false
                case 2:
                    this.$message('有文件上传失败')
                    return false
                }
            },
            // 点击删除文件时触发
            handleRemove() {
                if (this.uploadStatus === -1) {
                    // 上传失败的文件
                    this.uploadStatus = 0
                } else {
                    this.$confirm('是否删除该文件?', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning',
                        center: true
                    }).then(() => {
                        this.uploadStatus = 0
                        this.$emit('input')
                        this.$emit('change')
                    })
                }
            },
            // 文件上传失败时触发
            handleUploadError() {
                this.uploadStatus = -1
            },
            // 上传文件之前触发
            handleBeforeUpload(file) {
                let { maxSize, acceptType } = this.props
                let fileExtension = file.name.substring(file.name.lastIndexOf('.'))
                if (!isEmpty(acceptType) && acceptType.indexOf(fileExtension) === -1) {
                    this.$message({
                        message: `上传文件只能是 ${acceptType}格式`,
                        type: 'warning'
                    })
                    return false
                }
                if (!isEmpty(maxSize) && file.size / 1024 / 1024 > maxSize) {
                    this.$message({
                        message: `上传文件大小不能超过 ${maxSize}MB!`,
                        type: 'warning'
                    })
                    return false
                }
                this.uploadStatus = 1
                this.uploadProgress = 0
                return true
            },
            // 文件上传成功时触发
            handleUploadSuccess(response) {
                if (typeof this.formatResponse === 'function') {
                    response = this.formatResponse(response)
                }
                this.uploadStatus = 2
                this.$emit('input', response)
                this.$emit('change', response)
            },
            // 文件上传时触发
            handleUploadProgress(event) {
                let progress = event.percent
                this.uploadStatus = 1
                this.uploadProgress = progress
            },
            // 预览图片
            handleImageViewer() {
                this.$viewerElement.innerHTML = `<img src="${this.originalPath}">`
                this.$nextTick(() => {
                    this.$viewer.index = 0
                    this.$viewer.update()
                    this.$viewer.show()
                })
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-upload-card {
    display: flex;
    flex-wrap: wrap;
    ::v-deep {
        .el-upload {
            vertical-align: top;
        }
        .el-upload-dragger {
            &.is-dragover {
                .upload-button {
                    border-width: 2px;
                    border-color: #409EFF;
                }
            }
        }
        .el-upload--picture-card {
            line-height: inherit;
        }
        .el-upload-dragger {
            height: 100%;
            width: 100%;
            border-width: 0;
            border-color: transparent;
            background: transparent;
        }
        .el-upload__tip {
            display: inline-block;
            height: 50px;
            min-width: 340px;
            width: calc(100% - 190px);
            margin-left: 10px;
            vertical-align: top;
            line-height: 16px;
        }
    }
    .describe {
        position: absolute;
        left: 0;
        bottom: 0;
        right: 0;
        color: #fff;
        font-size: 12px;
        line-height: 2em;
        text-align: center;
        background: rgba(0,0,0,.6);
    }
    .upload-wrap {
        position: relative;
        background: #fff;
        color: #666;
        border-radius: 4px;
        background: #f5f7fa;
        border: solid 1px #E4E7ED;
        overflow: hidden;
        &:hover {
            .remove {
                opacity: 1;
            }
        }
        .image {
            width: 100%;
            height: 100%;
            cursor: zoom-in;
            border-radius: inherit;
            background-size: cover;
            background-position: 50% 50%;
            background-repeat: no-repeat;
        }
        .remove {
            position: absolute;
            top: 0;
            right: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 14px;
            font-weight: bold;
            background: red;
            opacity: 0;
            cursor: pointer;
            border-radius: 0 4px 0 0;
        }
        .error {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 6px;
            background: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #F56C6C;
        }
        .empty {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            i {
                color: #bbb;
                font-size: 40px;
                line-height: 1em;
            }
            p {
                font-size: 12px;
                color: #999;
                line-height: 1em;
                margin-top: 4px;
            }
        }
        .progress {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 6px;
            background: #333;
            display: flex;
            align-items: center;
            justify-content: center;
            ::v-deep {
                .el-progress__text {
                    color: #fff;
                }
            }
        }
    }
    .upload-button {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border: dashed 1px #c0ccda;
        background: #fff;
        color: #999;
        border-radius: 4px;
        overflow: hidden;
        &:hover {
            border-color: #409EFF;
        }
        .icon {
            font-size: 30px;
        }
    }
}
</style>
