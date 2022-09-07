<template>
    <el-button
        v-bind="props"
        class="sy-import-button"
        @click="handleActive"
    >{{ props.text }}
        <sy-dialog
            :visible.sync="visible"
            :beforeCloseAsking="loading"
            :title="title"
            width="400px"
            @close="handleClose"
        >
            <div class="import-step">
                <div class="title">
                    导入步骤：
                </div>
                <slot />
                <div class="rows-wrap">
                    {{ stepIndex + 1 }}. 请下载
                    <el-button
                        type="text"
                        class="download cell"
                        icon="el-icon-download"
                        @click="handleDownloadTemplate"
                    >{{ templateName }}</el-button>
                </div>
                <div :class="{loading: loading}" class="rows-wrap">
                    {{ stepIndex + 2 }}. 按模板填写数据后
                    <el-upload
                        ref="elUpload"
                        class="cell"
                        :data="uploadData_"
                        :limit="1"
                        :action="baseUrl + action"
                        :accept="accept"
                        :headers="headers_"
                        :showFileList="false"
                        :onError="hanldeError"
                        :onSuccess="handleSuccess"
                        :beforeUpload="handleBeforeUpload"
                    >
                        <el-button
                            v-bind="props"
                            :loading="loading"
                        >{{ props.text }}
                            <div class="overlay" @click="handleUploadClick" />
                        </el-button>
                    </el-upload>
                </div>
            </div>
            <span slot="footer">
                <el-button :loading="loading" size="mini" @click="handleClose">关 闭</el-button>
            </span>
        </sy-dialog>
    </el-button>
</template>

<script>
    // 方法
    import {
        isType,
        isPromise,
        attrsToProps,
        get2Function,
        differenceMerge,
        filterEmptyParams,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-import-button'
    const booleanKeys = [

    ]
    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            title: { type: String, default: '导入' },
            action: String, // 上传接口地址
            accept: { type: String, default: '.pdf, .docx, .doc, .wps, .xlsx, .xls, .xml' },
            baseUrl: { type: String, default: '' }, // 上传的跟域名
            headers: [Object, Function], // 上传的请求头部
            stepIndex: { type: Number, default: 0 }, // 步骤开始下标
            uploadData: { type: [Object, Function], default: () => {} }, // 上传参数
            templateName: { type: String, default: '导入模板' }, // 下载模板的文件名称
            beforeActive: { type: Function }, // 点击前
            beforeUpload: { type: Function }, // 上传前
            beforeDownload: { type: Function }, // 下载前
            downloadAction: [String, Function], // 下载模板
            downloadBaseUrl: String // 下载的跟域名
        }, NAME),
        data() {
            return {
                visible: false,
                loading: false
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return {
                    type: 'success',
                    icon: 'el-icon-upload2',
                    text: '导入',
                    ...props
                }
            },
            headers_() {
                if (isType(this.headers, 'function')) {
                    return this.headers()
                }
                return this.headers
            },
            uploadData_() {
                return filterEmptyParams(get2Function(this.uploadData))
            }
        },
        methods: {
            // 下载文件
            download(url) {
                console.log(url)
                let a = document.createElement('a')
                a.href = url
                a.target = '_blank'
                a.style.display = 'none'
                document.body.append(a)
                a.click()
                document.body.removeChild(a)
            },
            // 点击按钮时触发
            async handleActive() {
                if (typeof this.beforeActive === 'function') {
                    let pass = this.beforeActive()
                    if (isPromise(pass)) await pass
                    else if (!pass) return
                }
                this.visible = true
            },
            // 点击关闭按钮时触发
            handleClose() {
                this.loading = false
                this.visible = false
                this.$refs.elUpload.abort()
                this.$refs.elUpload.clearFiles()
            },
            // 上传失败
            hanldeError() {
                this.loading = false
                this.$message.error('导入失败！')
            },
            // 上传成功
            handleSuccess(data) {
                if (this.visible) {
                    if (data.success) {
                        this.$message.success('导入成功')
                        this.$emit('success', data)
                        this.visible = false
                    } else if (data.data) {
                        this.$confirm('存在失败记录，请下载处理结果，查看详细信息', '提示', {
                            type: 'error',
                            confirmButtonText: '下载',
                            cancelButtonText: '取消'
                        }).then(() => {
                            this.download(this.downloadBaseUrl + '/file?fileId=' + data.data)
                        })
                    } else {
                        this.$message.error(data.msg)
                    }
                }
                this.loading = false
                this.$refs.elUpload.clearFiles()
            },
            // 点击上传按钮时触发
            handleUploadClick(e) {
                if (typeof this.beforeUpload === 'function') {
                    if (!this.beforeUpload()) {
                        e.stopPropagation()
                    }
                }
            },
            // 上传文件之前触发
            handleBeforeUpload() {
                this.loading = true
                return true
            },
            // 点击下载模板按钮时触发
            async handleDownloadTemplate() {
                if (typeof this.beforeDownload === 'function') {
                    let pass = this.beforeDownload()
                    if (isPromise(pass)) await pass
                    else if (!pass) return
                }
                switch (isType(this.downloadAction)) {
                case 'string':
                    if (isType(this.$request, 'function')) {
                        let { data } = await this.$request({
                            url: this.baseUrl + get2Function(this.downloadAction),
                            method: 'get'
                        })
                        this.download(this.baseUrl + data.data)
                    }
                    break
                case 'function':
                    this.downloadAction()
                    break
                default:
                    this.$message.warning('暂无导入模板！')
                    break
                }
            }
        }
    }
</script>

<style scoped lang="scss">
.import-step {
    padding: 15px 20px;
    .title {
        font-size: 14px;
        font-weight: bold;
    }
    .download {
        &:hover {
            text-decoration: underline;
        }
    }
    .el-button {
        position: relative;
        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        }
    }
    ::v-deep {
        .rows-wrap {
            display: flex;
            align-items: center;
            margin-top: 10px;
            &.loading {
                pointer-events: none;
            }
            .cell{
                margin-left: 10px;
            }
        }
    }
}
</style>
