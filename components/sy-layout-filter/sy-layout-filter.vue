<!--
* @description 筛选布局
* @author yc
!-->
<template>
    <div class="sy-layout-filter sy-layout flex">
        <div class="sy-layout column flex auto">
            <div class="sy-layout">
                <slot name="top" />
            </div>
            <div class="sy-layout flex" v-if="toolbar">
                <!-- 按钮模块 -->
                <div class="sy-layout button-col" v-if="buttons">
                    <template v-for="(item, index) in buttons">
                        <el-button
                            v-if="get2Function(item.visible) !== false"
                            :key="index"
                            v-bind="item.props"
                            @click="get2Function(item.onClick, item)"
                        >
                            <!-- 自定义slot渲染 -->
                            <template v-if="item.slot">
                                <RenderDom
                                    v-for="(render, name) in item.slot"
                                    :key="name"
                                    :slot="name"
                                    :data="item"
                                    :render="render"
                                />
                            </template>
                            <template v-else>
                                {{ item.text }}
                            </template>
                        </el-button>
                    </template>
                </div>
                <!-- 筛选模块 -->
                <div class="sy-layout flex auto">
                    <!-- 筛选项 -->
                    <div class="filter-wrap" v-if="filters">
                        <template v-for="(item, index) in filters">
                            <component
                                v-if="get2Function(item.visible) !== false"
                                :key="index"
                                :is="item.type"
                                :value="params[item.prop]"
                                :bindObject="params"
                                :placeholder="item.label"
                                clearable
                                style="width: 200px"
                                v-bind="item.props"
                                :disabled="disableds.includes(item.prop)"
                                class="filter-item"
                                @input="handleItemInput(item, $event)"
                                @change="handleItemChange(item, $event)"
                            >
                                <!-- 自定义slot渲染 -->
                                <template v-if="item.slot">
                                    <RenderDom
                                        v-for="(render, name) in item.slot"
                                        :key="name"
                                        :slot="name"
                                        :data="item"
                                        :render="render"
                                    />
                                </template>
                            </component>
                        </template>
                        <el-popover
                            v-if="foldeds && foldeds.length"
                            v-model="filterPopover.visible"
                            placement="bottom-end"
                            width="700"
                            trigger="manual"
                            class="filter-item"
                            transition="el-zoom-in-top"
                            popper-class="sy-layout-filter-popover"
                            @after-leave="filterPopover.content = false"
                        >
                            <!-- 折叠的筛选项 -->
                            <div class="filter-popover" v-if="filterPopover.content">
                                <div class="body-wrap">
                                    <template v-for="(item, index) in foldeds">
                                        <div
                                            v-if="get2Function(item.visible) !== false"
                                            class="filter-popover-item"
                                            :key="index"
                                        >
                                            <div class="item-label">{{ item.label }}</div>
                                            <div class="item-mian">
                                                <component
                                                    :value="params[item.prop]"
                                                    :is="item.type"
                                                    :bindObject="params"
                                                    :placeholder="item.label"
                                                    clearable
                                                    v-bind="item.props"
                                                    :disabled="disableds.includes(item.prop)"
                                                    class="filter-item"
                                                    @input="handleItemInput(item, $event)"
                                                >
                                                    <!-- 自定义slot渲染 -->
                                                    <template v-if="item.slot">
                                                        <RenderDom
                                                            v-for="(render, name) in item.slot"
                                                            :key="name"
                                                            :slot="name"
                                                            :data="item"
                                                            :render="render"
                                                        />
                                                    </template>
                                                </component>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                                <div class="foot-wrap">
                                    <el-button type="primary" @click="handleFilter">
                                        查询
                                    </el-button>
                                    <el-button @click="handleReset">
                                        重置
                                    </el-button>
                                    <el-button @click="filterPopover.visible = false">
                                        关闭
                                    </el-button>
                                </div>
                            </div>
                            <el-button
                                ref="filterButton"
                                size="mini"
                                type="primary"
                                slot="reference"
                                @click="handleFilterButton"
                            >
                                筛选
                                <i class="el-icon-caret-bottom el-icon--right" />
                            </el-button>
                        </el-popover>
                        <el-tooltip effect="dark" content="筛选" placement="top" class="filter-item">
                            <el-button
                                circle
                                size="mini"
                                icon="el-icon-search"
                                @click="handleFilter"
                            />
                        </el-tooltip>
                        <sy-dropdown class="filter-item">
                            <el-tooltip slot="button" effect="dark" content="更多操作" placement="top">
                                <el-button circle size="mini" icon="el-icon-more" />
                            </el-tooltip>
                            <div
                                class="dropdown-item"
                                @click="$emit('clear')"
                            >
                                <el-dropdown-item divided icon="el-icon-delete-solid">清空条件</el-dropdown-item>
                            </div>
                            <div
                                class="dropdown-item"
                                @click="fieldEditDialog.visible = true"
                            >
                                <el-dropdown-item divided icon="el-icon-menu">列表设置</el-dropdown-item>
                            </div>
                        </sy-dropdown>
                    </div>
                    <!-- 筛选工具 -->
                    <div class="filter-tool" />
                </div>
            </div>
            <div class="sy-layout auto">
                <slot />
            </div>
            <div class="sy-layout">
                <slot name="bottom" />
            </div>
        </div>
        <div style="height: 0">
            <el-dialog
                :visible.sync="fieldEditDialog.visible"
                append-to-body
                title="字段控制"
                width="560px"
                top="200px"
            >
                <div class="filter-transfer">
                    <el-transfer
                        v-model="fieldEditDialog.value"
                        :data="fieldEditDialog.data"
                        :titles="['隐藏', '显示']"
                        @change="handleTransferChange"
                    />
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script>
    // 方法
    import {
        batchWatch,
        get2Function,
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    // dom渲染组件
    const NAME = 'sy-layout-filter'
    const RenderDom = {
        render: (h, ctx) => {
            return render({
                h,
                ctx,
                data
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
            // 筛选参数
            params: Object,
            // 按钮列表
            buttons: Array,
            // 筛选项列表
            filters: Array,
            // 折叠的筛选项列表
            foldeds: Array,
            // 工具栏显示状态
            toolbar: Boolean,
            // 表格列配置
            columns: Array,
            // 禁用的筛选项
            disableds: { type: Array, default: () => [] }
        }, NAME),
        data() {
            return {
                filterPopover: {
                    visible: false,
                    content: false
                },
                fieldEditDialog: {
                    data: [],
                    value: [],
                    visible: false
                }
            }
        },
        computed: {
        },
        watch: {
            columns: {
                immediate: true,
                handler(columns) {
                    let data = []
                    let value = []
                    if (Array.isArray(columns)) {
                        let recursion = (list, path) => {
                            list.forEach((item, index) => {
                                let newPath = `${path ? path + '-' : ''}${index}`
                                if (item.children && item.children.length) {
                                    recursion(item.children, newPath)
                                } else if (item.notTransfer !== false) {
                                    data.push({
                                        key: newPath,
                                        label: item.label,
                                        disabled: !!item.disabled
                                    })
                                    if (item.visible !== false) {
                                        value.push(newPath)
                                    }
                                }
                            })
                        }
                        recursion(columns, '')
                    }
                    this.fieldEditDialog.data = data
                    this.fieldEditDialog.value = value
                }
            }
        },
        mounted() {
            ['buttons', 'filters', 'foldeds'].forEach(name => {
                this.$watch(name, this.batchWatch)
                this.batchWatch(this[name])
            })
            this.resetVisible()
        },
        methods: {
            get2Function,
            // 批量watch处理
            batchWatch(data) {
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (Array.isArray(item.watchs)) {
                            batchWatch.call(this, item)
                        }
                    })
                }
            },
            // 重置所有表格列的可见状态
            resetVisible() {
                let recursion = column => {
                    if (Array.isArray(column.children)) {
                        column.children.forEach(recursion(item))
                    }
                    this.$set(column, '__visible__', true)
                }
                this.columns.forEach(recursion)
            },
            // 点击重置按钮时触发
            handleReset() {
                this.$emit('reset')
                this.filterPopover.visible = false
            },
            // 点击查询按钮时触发
            handleFilter() {
                this.$emit('filter')
                this.filterPopover.visible = false
            },
            // 筛选项输入时触发
            handleItemInput(item, value) {
                get2Function(item.onInput, value)
                this.$set(this.params, item.prop, value)
            },
            // 筛选项改变时触发
            handleItemChange(item, data) {
                get2Function(item.onChange, { item, data })
                this.$emit('filter')
            },
            // 点击折叠按钮时触发
            handleFilterButton() {
                let visible = !this.filterPopover.visible
                if (visible) {
                    this.filterPopover.content = visible
                }
                this.filterPopover.visible = visible
            },
            // 穿梭框改变时触发
            handleTransferChange(res) {
                let columns = {
                    children: this.columns
                }
                this.fieldEditDialog.data.forEach(item => {
                    let column = columns
                    item.key.split('-').forEach(idx => {
                        column = column.children[idx]
                    })
                    if (res.indexOf(item.key) > -1) {
                        this.$set(column, '__visible__', true)
                    } else {
                        this.$set(column, '__visible__', false)
                    }
                })
                // 更新存在多级嵌套结构的显示状态
                let recursion = column => {
                    if (column.children && column.children.length) {
                        let __visible__ = false
                        column.children.every(item => {
                            if (recursion(item)) {
                                __visible__ = true
                                return false
                            }
                            return true
                        })
                        this.$set(column, '__visible__', __visible__)
                    } else {
                        if (column.notTransfer === false) {
                            return true
                        } else {
                            return column.__visible__
                        }
                    }
                }
                this.columns.forEach(recursion)
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-layout-filter {
    width: 100%;
    height: 100%;
    .button-col {
        .el-button {
            margin-bottom: 10px;
            & + .el-button {
                margin-left: 10px;
            }
        }
    }
    .filter-wrap {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        margin-right: 10px;
        .filter-item {
            margin-bottom: 10px;
            & + .filter-item {
                margin-left: 10px;
            }
        }
    }
    ::v-deep {
        .el-button--mini {
            height: 28px;
        }
    }
}
.filter-popover {
    .body-wrap {
        display: flex;
        flex-wrap: wrap;
        max-height: 50vh;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 10px 20px 0;
        .filter-popover-item {
            width: 50%;
            display: flex;
            align-items: center;
            padding: 10px 0;
            .item-label {
                width: 100px;
                font-size: 12px;
                text-align: right;
                color: #333;
                font-weight:bold;
                line-height: 14px;
                padding: 0 10px;
            }
            .item-mian {
                flex: 1;
            }
        }
        .filter-item {
            width: 100%;
        }
    }
    .foot-wrap {
        padding: 10px 20px;
        background: #f5f5f5;
        text-align: center;
        margin-top: 10px;
    }
    ::v-deep {
        .el-select,
        .el-input-number,
        .el-cascader,
        .el-date-editor {
            width: 100%;
        }
    }
}
.filter-transfer {
    ::v-deep {
        .el-transfer {
            display: flex;
            justify-content: center;
            align-items: center;
            .el-transfer-panel__header {
                .el-checkbox {
                    .el-checkbox__label {
                    vertical-align: baseline;
                    }
                }
            }
            .el-transfer__buttons {
                display: inline-block;
                vertical-align: middle;
                padding: 0 30px;
            }
            .el-transfer__button {
                display: block;
                margin: 0 auto;
                padding: 10px;
                height: initial;
                &:first-child {
                    margin-bottom: 10px;
                }
            }
            .el-transfer-panel__item {
                display: block;
            }
        }
    }
}
::v-deep {
    .el-input__validateIcon {
        display: none;
    }
}
</style>
