<!--
* @description 表单配置
* @author yc
!-->
<template>
    <div class="sy-form-config">
        <el-form
            ref="elForm"
            :size="size"
            :model="formData"
            :rules="formRule"
            :label-width="labelWidth"
        >
            <el-row>
                <template v-for="item in formItem">
                    <el-col
                        v-if="_getItemVisible(item)"
                        :key="item.prop"
                        :span="isEmpty(item.span) ? span : item.span"
                    >
                        <el-form-item
                            :prop="item.prop"
                            :label="item.label"
                            :rules="_getItemRules(item)"
                            :label-width="item.labelWidth"
                        >
                            <!-- 前置渲染器 -->
                            <div class="item-prepend" v-if="item.prependRender">
                                <RenderDom
                                    :item="item"
                                    :render="item.prependRender"
                                />
                            </div>
                            <div
                                class="item-main"
                                :class="{
                                    'clickable': (disabled || readonly) && get2Function(item.isClick)
                                }"
                                @click="_handleItemClick(item)"
                            >
                                <!-- 自定义渲染 -->
                                <RenderDom
                                    v-if="item.render"
                                    :item="item"
                                    :render="item.render"
                                />
                                <component
                                    v-else
                                    :is="item.type"
                                    v-on="_getItemEvent(item)"
                                    v-bind="_getItemProps(item)"
                                    @input="_handleItemInput(item, $event)"
                                >
                                    <!-- 自定义slot渲染 -->
                                    <template v-if="item.slots">
                                        <RenderDom
                                            v-for="(render, name) in item.slots"
                                            :key="name"
                                            :slot="name"
                                            :item="item"
                                            :render="render"
                                        />
                                    </template>
                                </component>
                            </div>
                            <!-- 后置渲染器 -->
                            <div class="item-append" v-if="item.appendRender">
                                <RenderDom
                                    :item="item"
                                    :render="item.appendRender"
                                />
                            </div>
                        </el-form-item>
                    </el-col>
                </template>
            </el-row>
        </el-form>
    </div>
</template>

<script>
    // 方法
    import {
        isType,
        isEmpty,
        getProperty,
        get2Function,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps from '../default-props'
    import createComponent from '../utils/createComponent'
    import { validatePremise } from './utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    // dom渲染组件
    const NAME = 'sy-form-config'
    const RenderDom = {
        props: {
            item: Object,
            render: Function
        },
        render: (h, ctx) => {
            return ctx.props.render({
                h,
                ctx,
                item: ctx.props.item
            })
        },
        functional: true
    }

    export default {
        name: hyphenationToCamel(NAME),
        components: {
            RenderDom
        },
        inheritAttrs: false,
        props: setPropsDefault({
            // 表单数据
            formData: Object,
            // 表单项配置
            formItem: Array,
            // 表单验证规则
            formRule: Object,
            // 是否禁用状态
            disabled: Boolean,
            // 是否只读状态
            readonly: Boolean,
            // 组件尺寸
            size: String,
            // 栅格占据的列数
            span: { type: Number, default: 12 },
            // 表单域标签的宽度
            labelWidth: String
        }, NAME),
        computed: {
        },
        watch: {
        },
        mounted() {
        },
        methods: {
            isEmpty,
            get2Function,
            // 对整个表单进行校验
            validate(showMessage = true) {
                return new Promise((resolve, reject) => {
                    this.$refs.elForm.validate((bool, err) => {
                        if (bool) {
                            resolve()
                        } else {
                            if (showMessage) {
                                this.$message.warning(Object.values(err)[0][0].message)
                            }
                            reject(err)
                        }
                    })
                })
            },
            // 对部分表单字段进行校验
            validateField(props, showMessage = true) {
                return new Promise((resolve, reject) => {
                    props = Array.isArray(props) ? props : [props]
                    let index = 0
                    let length = props.length
                    let errors = []
                    this.$refs.elForm.validateField(props, (err) => {
                        if (err) {
                            errors.push(err)
                        }
                        if (++index >= length) {
                            // 全部字段已校验
                            if (errors.length) {
                                if (showMessage) {
                                    this.$message.warning(errors[0])
                                }
                                reject(errors)
                            } else {
                                resolve()
                            }
                        }
                    })
                })
            },
            // 重置表单
            resetFields() {
                this.$refs.elForm.resetFields()
            },
            // 移除表单项的校验结果
            clearValidate(props) {
                this.$refs.elForm.clearValidate(props)
            },
            // 获取表单项的props
            _getItemProps(item) {
                let props = differenceMerge({}, item.props, defaultProps[item.type])
                props.value = this.formData[item.prop]
                props.disabled = this._getItemDisabled(item)
                props.readonly = this._getItemReadonly(item)
                props.clearable = isEmpty(props.clearable) ? isEmpty(item.rules) : props.clearable
                props.placeholder = isEmpty(props.placeholder) ? item.label : props.placeholder
                props.bindObject = this.formData
                props.__formItem__ = item
                return props
            },
            // 获取表单项绑定事件
            _getItemEvent(item) {
                let testReg = /^on[A-Z]/
                let keys = Object.keys(item).filter(key => testReg.test(key))
                let listeners = {}
                keys.forEach(key => {
                    listeners[hyphenationToCamel(key.substring(2), true).replace(/^-|-$/g, '')] = function($event) {
                        item[key]($event, item)
                    }
                })
                return listeners
            },
            // 获取表单项验证规则
            _getItemRules(item) {
                if (!this._getItemDisabled(item) && !this._getItemReadonly(item)) {
                    if (Array.isArray(item.rules)) {
                        return validatePremise(item.rules, this.formData)
                    }
                }
            },
            // 获取表单项的可见状态
            _getItemVisible(item) {
                if (item.visible !== false) {
                    return true
                }
                return false
            },
            // 获取表单项的禁用状态
            _getItemDisabled(item) {
                if (this.disabled) {
                    return this.disabled
                } else {
                    return getProperty(item, 'props.disabled')
                }
            },
            // 获取表单项的只读状态
            _getItemReadonly(item) {
                if (this.readonly) {
                    return this.readonly
                } else {
                    return getProperty(item, 'props.readonly')
                }
            },
            // 表单项输入时触发
            _handleItemInput(item, value) {
                this.$set(this.formData, item.prop, value)
            },
            // 列表项点击时触发
            _handleItemClick(item) {
                if (this._getItemReadonly(item) || this._getItemDisabled(item)) {
                    let params = { item }
                    if (get2Function(item.isClick, params)) {
                        let clickType = get2Function(item.clickType, params)
                        if (clickType) {
                            createComponent({
                                component: clickType,
                                attribute: {
                                    props: {
                                        dataId: this.formData[item.idKey || 'id']
                                    }
                                }
                            })
                        }
                        if (isType(item.onClick, 'function')) {
                            get2Function(item.onClick, params)
                        }
                    }
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-form-config {
    ::v-deep {
        .el-form-item {
            margin-bottom: 0 !important;
        }
        .el-form-item--mini {
            .item-main {
                min-height: 30px;
            }
            .el-form-item__error {
                font-size: 12px;
                padding-top: 3px;
            }
        }
        .el-form-item__label {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            line-height: 14px !important;
            min-height: 30px;
        }
        .el-form-item__content {
            display: flex;
            align-items: center;
        }
        .el-textarea.is-disabled .el-textarea__inner {
            border: 1px solid #E4E7ED !important;
        }
    }
    .el-col {
        padding: 8px 0;
    }
    .item-main {
        flex: 1;
        display: flex;
        align-items: center;
        ::v-deep {
            & > * {
                width: 100%;
            }
        }
        &.clickable {
            ::v-deep {
                .el-input__inner {
                    cursor: pointer !important;
                    color: #409eff !important;
                    &:hover {
                        text-decoration: underline !important;
                    }
                }
            }
        }
    }
}
</style>
