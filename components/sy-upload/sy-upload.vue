<!--
* @description 上传
* @author yc
!-->
<template>
    <div class="sy-upload">
        <el-upload
            v-if="allowEdit"
            v-bind="props"
            class="upload-wrap"
            :before-upload="handleBeforeUpload"
            :on-success="handleUploadSuccess"
            :on-progress="handleUploadProgress"
            :on-exceed="handleUploadExceed"
            :on-error="handleUploadError"
        >
            <div class="upload-button">
                <i class="el-icon-upload" />
                <div class="el-upload__text">
                    将文件拖到此处，或
                    <em>点击上传</em>
                </div>
            </div>
            <div slot="tip" class="el-upload__tip">
                最多可选{{ props.limit }}个文件,单个文件不超过30M，<br>
                仅仅接收（{{ props.acceptType }}）
            </div>
        </el-upload>
        <template v-if="mediaCount + fileCount > 0">
            <!-- 媒体列表 -->
            <div class="media-wrap" v-viewer="{ url:'data-original' }" v-if="mediaCount > 0">
                <!-- 默认展示的媒体文件列表 -->
                <div
                    class="item"
                    v-for="(file, index) in viewFileList.mediaList"
                    :key="index"
                >
                    <img
                        v-if="file.fileType === 'image'"
                        :src="getThumbPath(file)"
                        class="el-upload-list__item-thumbnail"
                        @click="handleImageViewer(file)"
                    >
                    <video
                        v-else
                        :src="getOriginalPath(file)"
                        controls
                        class="el-upload-list__item-thumbnail img"
                        style="background: #000;"
                    />
                    <div class="el-icon-close remove" v-if="allowEdit" @click="handleRemove(file)" />
                </div>
                <!-- 正在上传的媒体文件列表 -->
                <div
                    class="item"
                    v-for="file in viewFileList.mediaUpload"
                    :key="file.fileId"
                >
                    <div class="progress">
                        <el-progress v-if="file.status === 1" type="circle" :percentage="file.progress" :width="60" :stroke-width="3" />
                        <template v-if="file.status === 2">
                            <div class="error">上传失败</div>
                            <div class="el-icon-close remove" v-if="allowEdit" @click="handleRemove(file)" />
                        </template>
                    </div>
                </div>
            </div>
            <!-- 其他文件 -->
            <div class="files-wrap" v-if="fileCount > 0">
                <!-- 默认展示的非媒体文件列表 -->
                <div
                    class="item"
                    v-for="(file, index) in viewFileList.fileList"
                    :key="index"
                    @click="handleDownload(file)"
                >
                    <i class="el-icon-document" />
                    <span class="file-name sy-ui-ellipsis l1">{{ file.fileName + '.' + file.fileExtension }}</span>
                    <i class="el-icon-close remove" v-if="allowEdit" @click.stop="handleRemove(file)" />
                </div>
                <!-- 正在上传的非媒体文件列表 -->
                <div
                    class="item"
                    v-for="file in viewFileList.fileUpload"
                    :key="file.fileId"
                >
                    <el-progress v-if="file.status === 1" :percentage="file.progress" :stroke-width="3" />
                    <template v-if="file.status === 2">
                        <i class="el-icon-document" />
                        <span class="error">上传失败</span>
                        <i class="el-icon-close remove" v-if="allowEdit" @click="handleRemove(file)" />
                    </template>
                </div>
            </div>
        </template>
        <template v-else-if="!allowEdit">- -</template>
    </div>
</template>

<script>
    // API
    // 方法
    import {
        isEmpty,
        getFileType,
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    import Viewer from 'viewerjs'

    const NAME = 'sy-upload'
    const booleanKeys = [
        'drag',
        'multiple',
        'withCredentials',
        'showFileList',
        'autoUpload',
        'disabled'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            value: null,
            // 是否卡片样式
            card: Boolean,
            // 是否只读模式
            readonly: Boolean,
            // 缩略图地址
            thumbApi: String,
            // 文件原始地址
            originalApi: String,
            // 上传成功后自定义格式化返回值
            formatResponse: Function
        }, NAME),
        data() {
            return {
                uploadedList: [], // 上传完成的文件列表
                uploadingList: [] // 上传中的文件列表
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
            // 其他文件数量
            fileCount() {
                let { fileList, fileUpload } = this.viewFileList
                return fileList.length + fileUpload.length
            },
            // 媒体文件数量
            mediaCount() {
                let { mediaList, mediaUpload } = this.viewFileList
                return mediaList.length + mediaUpload.length
            },
            // 展示的文件列表
            viewFileList() {
                let { uploadedList, uploadingList } = this
                return {
                    fileList: uploadedList.filter(v => v.fileType === 'file'),
                    fileUpload: uploadingList.filter(v => v.fileType === 'file'),
                    mediaList: uploadedList.filter(v => ['image', 'video'].includes(v.fileType)),
                    mediaUpload: uploadingList.filter(v => ['image', 'video'].includes(v.fileType))
                }
            }
        },
        watch: {
            'props.value': {
                deep: true,
                handler() {
                    this.updateFileList()
                }
            }
        },
        mounted() {
            this.$viewerElement = document.createElement('div')
            this.$viewer = new Viewer(this.$viewerElement)
            this.updateFileList()
        },
        methods: {
            // 校验所有文件是否上传完成
            validateUploadComplete() {
                return this.uploadingList.findIndex(file => {
                    switch (file.status) {
                    case 1:
                        this.$message('有文件正在上传中')
                        return true
                    case 2:
                        this.$message('有文件上传失败')
                        return true
                    }
                }) > -1
            },
            // 更新已上传的文件列表
            updateFileList() {
                let fileList = this.value || []
                this.uploadedList = fileList.map(({ fileId, fileName }) => {
                    return {
                        fileId,
                        fileType: getFileType(fileName),
                        fileName: fileName.substring(0, fileName.lastIndexOf('.')),
                        fileExtension: fileName.substring(fileName.lastIndexOf('.') + 1),
                        status: 0
                    }
                })
            },
            // 获取缩略图路径
            getThumbPath(file) {
                return this.thumbApi + file.fileId
            },
            // 获取下载路径
            getOriginalPath(file) {
                return this.originalApi + file.fileId
            },
            // 点击删除文件时触发
            handleRemove(file) {
                let fileList = this.value || []
                if (file.progress === -1) {
                    // 上传失败的文件
                    let index = this.uploadingList.findIndex(v => v === file)
                    if (index > -1) {
                        this.uploadingList.splice(index, 1)
                        this.$emit('change', fileList)
                    }
                } else {
                    let index = fileList.findIndex(v => v.fileId === file.fileId)
                    if (index > -1) {
                        this.$confirm('是否删除该文件?', '提示', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning',
                            center: true
                        }).then(() => {
                            fileList.splice(index, 1)
                            this.$emit('input', fileList)
                            this.$emit('change', fileList)
                        })
                    }
                }
            },
            // 点击下载文件时触发
            handleDownload(file) {
                window.open(this.getOriginalPath(file))
            },
            // 文件上传失败时触发
            handleUploadError(_, file) {
                let fileData = this.uploadingList.find(item => item.fileId === file.uid)
                if (fileData) {
                    fileData.status = 2
                    fileData.progress = -1
                }
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
                this.uploadingList.push({
                    fileId: file.uid,
                    fileName: file.name,
                    fileType: getFileType(file.name),
                    status: 1,
                    progress: 0
                })
                return true
            },
            // 文件上传成功时触发
            handleUploadSuccess(response, file) {
                let fileList = Array.isArray(this.value) ? this.value : []
                let index = this.uploadingList.findIndex(item => item.fileId === file.uid)
                if (index > -1) {
                    this.uploadingList.splice(index, 1)
                    if (typeof this.formatResponse === 'function') {
                        response = this.formatResponse(response)
                    }
                    fileList.push(response)
                    this.$emit('input', fileList)
                    this.$emit('change', fileList)
                }
            },
            // 文件上传时触发
            handleUploadProgress(event, file) {
                let progress = event.percent
                let fileData = this.uploadingList.find(item => item.file === file)
                if (fileData) {
                    fileData.progress = progress
                }
            },
            // 文件超出个数限制时触发
            handleUploadExceed(files) {
                this.$message.warning(
                    `当前限制选择 ${this.props.limit} 个文件，本次选择了 ${files.length} 个文件，共选择了 ${this.fileCount + this.mediaCount} 个文件`
                )
            },
            // 预览图片
            handleImageViewer(file) {
                let images = this.viewFileList.mediaList.filter(file => file.fileType === 'image')
                this.$viewerElement.innerHTML = images.map(file => `<img src="${this.getOriginalPath(file)}">`).join('')
                this.$nextTick(() => {
                    this.$viewer.index = images.indexOf(file)
                    this.$viewer.update()
                    this.$viewer.show()
                })
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-upload {
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
        .el-icon-upload {
            color: #C0C4CC;
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
    .upload-button {
        height: 80px;
        width: 180px;
        border: dashed 1px #c0ccda;
        background: #fff;
        color: #666;
        border-radius: 4px;
        padding: 12px 0;
        &:hover {
            border-color: #409EFF;
        }
        .el-icon-upload {
            margin: 0;
            font-size: 28px;
            display: block;
            line-height: 1em;
        }
        .el-upload__text {
            font-size: 12px;
        }
    }
    .upload-wrap {
        & + .media-wrap {
            margin-top: 0;
        }
    }
    .media-wrap {
        display: flex;
        flex-wrap: wrap;
        margin-top: -10px;
        & + .files-wrap {
            margin-top: 10px;
        }
        .item {
            position: relative;
            width: 70px;
            height: 70px;
            margin-top: 10px;
            & + .item {
                margin-left: 10px;
            }
            &:hover {
                .remove {
                    opacity: 1;
                }
            }
            img {
                width: 100%;
                height: 100%;
                border-radius: 6px;
                border: solid 1px #c0ccda;
                cursor: zoom-in;
            }
            video {
                width: 70px;
                height: 70px;
                border-radius: 6px;
                border: solid 1px #c0ccda;
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
    }
    .files-wrap {
        border-top: solid 1px #f1f1f1;
        .item {
            display: flex;
            align-items: center;
            height: 26px;
            padding-left: 10px;
            color: #999;
            cursor: pointer;
            border-bottom: solid 1px #f1f1f1;
            &:hover {
                background: #f9f9f9;
                .file-name {
                    text-decoration: underline;
                }
                .remove {
                    opacity: 1;
                }
            }
            .file-name {
                flex: 1;
                color: #409EFF;
                margin: 0 10px;
            }
            .remove {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 26px;
                height: 26px;
                opacity: 0;
                &:hover {
                    color: #409EFF;
                }
            }
            .error {
                flex: 1;
                margin: 0 10px;
                color: #F56C6C;
            }
            .el-progress {
                flex: 1;
                ::v-deep {
                    .el-progress__text {
                        color: #999;
                        font-size: 12px !important;
                    }
                }
            }
        }
    }
}
</style>
