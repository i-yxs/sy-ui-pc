<!--
* @description 筛选布局
* @author yc
!-->
<template>
    <div class="sy-layout-filter" :class="{cell: cell}">
        <div class="sy-layout cell" v-if="layout.left">
            <slot name="left" />
        </div>
        <div class="sy-layout column flex auto">
            <div class="sy-layout cell" v-if="layout.top">
                <slot name="top" />
            </div>
            <div class="sy-layout flex auto cell">
                <div class="sy-layout flex auto column">
                    <div class="sy-layout flex" v-if="toolbar">
                        <!-- 按钮模块 -->
                        <div class="sy-layout button-col">
                            <template v-for="(item, index) in buttons_">
                                <RenderDom
                                    v-if="item.render"
                                    :key="index"
                                    :data="item"
                                    :params="params"
                                    :render="item.render"
                                />
                                <template v-else>
                                    <el-button
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
                                        <template v-else>{{ item.text }}</template>
                                    </el-button>
                                </template>
                            </template>
                        </div>
                        <!-- 筛选模块 -->
                        <div class="sy-layout flex auto">
                            <!-- 筛选项 -->
                            <div class="filter-wrap" v-if="filters">
                                <template v-for="(item, index) in filters">
                                    <template v-if="get2Function(item.visible) !== false">
                                        <RenderDom
                                            v-if="item.render"
                                            :key="index"
                                            :data="item"
                                            :params="params"
                                            :render="item.render"
                                        />
                                        <component
                                            v-else
                                            :key="index"
                                            :is="item.type"
                                            v-bind="getItemProps(item)"
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
                                </template>
                                <el-popover
                                    v-if="foldeds && foldeds.length"
                                    v-model="filterPopover.visible"
                                    placement="bottom-end"
                                    width="700"
                                    trigger="manual"
                                    class="filter-item"
                                    transition="el-zoom-in-top"
                                    popperClass="sy-layout-filter-popover"
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
                                                        <RenderDom
                                                            v-if="item.render"
                                                            :data="item"
                                                            :params="params"
                                                            :render="item.render"
                                                        />
                                                        <component
                                                            v-else
                                                            :is="item.type"
                                                            v-bind="getItemProps(item, true)"
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
                                <el-tooltip effect="dark" content="搜索" placement="top" class="filter-item">
                                    <el-button
                                        circle
                                        size="mini"
                                        icon="el-icon-search"
                                        @click="handleFilter"
                                    />
                                </el-tooltip>
                                <sy-dropdown class="filter-item more">
                                    <el-tooltip slot="button" effect="dark" content="更多操作" placement="top">
                                        <el-button circle size="mini" icon="el-icon-more" />
                                    </el-tooltip>
                                    <div class="dropdown-item" @click="$emit('clear')">
                                        <el-dropdown-item divided icon="el-icon-delete-solid">清空条件</el-dropdown-item>
                                    </div>
                                    <div class="dropdown-item" @click="transferDialog.visible = true">
                                        <el-dropdown-item divided icon="el-icon-menu">字段控制</el-dropdown-item>
                                    </div>
                                </sy-dropdown>
                            </div>
                        </div>
                    </div>
                    <div class="sy-layout" v-if="layout.middle">
                        <slot name="middle" />
                    </div>
                    <div class="sy-layout auto" v-if="layout.default">
                        <slot />
                    </div>
                </div>
            </div>
            <div class="sy-layout cell" v-if="layout.bottom">
                <slot name="bottom" />
            </div>
        </div>
        <div class="sy-layout cell" v-if="layout.right">
            <slot name="right" />
        </div>
        <div style="height: 0">
            <sy-dialog
                title="字段控制"
                :visible.sync="transferDialog.visible"
                :beforeCloseAsking="false"
                width="530px"
            >
                <div class="filter-transfer">
                    <el-tabs
                        v-model="transferDialog.value"
                        class="sy-tabs not-margin"
                    >
                        <el-tab-pane
                            name="fixed"
                            label="固定状态"
                        >
                            <el-transfer
                                v-bind="fieldFixedTransfer"
                                @change="handleFieldFixedChange"
                            >
                                <span slot-scope="{ option }" :title="option.label">{{ option.label }}</span>
                            </el-transfer>
                        </el-tab-pane>
                        <el-tab-pane
                            name="visible"
                            label="显示状态"
                        >
                            <el-transfer
                                v-bind="fieldVisibleTransfer"
                                @change="handleFieldVisibleChange"
                            >
                                <span slot-scope="{ option }" :title="option.label">{{ option.label }}</span>
                            </el-transfer>
                        </el-tab-pane>
                    </el-tabs>
                </div>
            </sy-dialog>
        </div>
    </div>
</template>

<script>
    // 方法
    import {
        batchWatch,
        getProperty,
        get2Function,
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    // dom渲染组件
    const NAME = 'sy-layout-filter'
    const RenderDom = {
        props: {
            data: Object,
            params: Object,
            render: Function
        },
        render: (h, context) => {
            let { props } = context
            return props.render({
                h,
                data: props.data,
                params: props.params
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
            // cell样式
            cell: Boolean,
            // 筛选参数
            params: Object,
            // rem模式
            remMode: Boolean,
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
            // 筛选项宽度
            itemWidth: { type: Number, default: 200 },
            // 禁用的筛选项
            disableds: { type: Array, default: () => [] },
            // 自定义权限检查函数
            checkAccessMethod: Function
        }, NAME),
        data() {
            return {
                layout: {
                    top: false,
                    left: false,
                    right: false,
                    bottom: false,
                    middle: false,
                    default: false
                },
                filterPopover: {
                    visible: false,
                    content: false
                },
                transferDialog: {
                    value: 'fixed',
                    visible: false
                },
                fieldFixedTransfer: {
                    titles: ['固定', '正常']
                },
                fieldVisibleTransfer: {
                    titles: ['隐藏', '显示']
                }
            }
        },
        computed: {
            buttons_() {
                if (Array.isArray(this.buttons)) {
                    return this.buttons.filter(this.getItemVisible)
                }
                return []
            }
        },
        watch: {
            columns: 'initTransfer'
        },
        mounted() {
            ['buttons', 'filters', 'foldeds'].forEach(name => {
                this.$watch(name, this.batchWatch)
                this.batchWatch(this[name])
            })
            this.resetColumn()
            this.initTransfer()
            this.updateLayoutVisible()
        },
        updated() {
            this.updateLayoutVisible()
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
            // 重置所有表格列
            resetColumn() {
                let recursion = column => {
                    if (Array.isArray(column.children)) {
                        column.children.forEach(recursion)
                    }
                    this.$set(column, '__fixed__', void 0)
                    this.$set(column, '__visible__', true)
                }
                this.columns.forEach(recursion)
            },
            // 初始化穿梭框数据
            initTransfer() {
                let fixed = {
                    data: [],
                    value: []
                }
                let visible = {
                    data: [],
                    value: []
                }
                if (Array.isArray(this.columns)) {
                    let recursion = (columns, path, deep) => {
                        columns.forEach((column, index) => {
                            let newPath = `${path ? path + '.' : ''}${index}`
                            // 固定属性只对第一级表头有效
                            if (deep === 0 && getProperty(column, 'enable.fixed') !== false) {
                                fixed.data.push({
                                    key: newPath,
                                    label: column.label
                                })
                                if (!column.fixed) {
                                    fixed.value.push(newPath)
                                }
                            }
                            if (column.children && column.children.length) {
                                recursion(column.children, newPath, deep + 1)
                            } else {
                                if (getProperty(column, 'enable.visible') !== false) {
                                    visible.data.push({
                                        key: newPath,
                                        label: column.label
                                    })
                                    visible.value.push(newPath)
                                }
                            }
                        })
                    }
                    recursion(this.columns, '', 0)
                }
                this.fieldFixedTransfer = {
                    ...this.fieldFixedTransfer,
                    ...fixed
                }
                this.fieldVisibleTransfer = {
                    ...this.fieldVisibleTransfer,
                    ...visible
                }
            },
            // 获取筛选项props
            getItemProps(item, isFoldeds) {
                let itemWidth = `${this.itemWidth}${this.remMode ? 'rem' : 'px'}`
                return {
                    value: this.params[item.prop],
                    style: {
                        width: isFoldeds ? '100%' : itemWidth,
                        ...getProperty(item, 'props.style')
                    },
                    clearable: true,
                    bindObject: this.params,
                    placeholder: item.label,
                    ...item.props,
                    disabled: this.disableds.includes(item.prop)
                }
            },
            // 获取筛选项可见状态
            getItemVisible(item) {
                let { visible, accessKey } = item
                if (get2Function(visible) !== false) {
                    if (typeof this.checkAccessMethod === 'function') {
                        accessKey = get2Function(accessKey)
                        if (accessKey) return this.checkAccessMethod(accessKey)
                    }
                    return true
                }
                return false
            },
            // 更新布局显示状态
            updateLayoutVisible() {
                Object.keys(this.layout).forEach(key => {
                    this.layout[key] = !!this.$slots[key]
                })
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
            // 字段固定状态改变时触发
            handleFieldFixedChange(value) {
                this.fieldFixedTransfer.value = value
                this.fieldFixedTransfer.data.forEach(item => {
                    let column = this.columns[item.key]
                    if (value.indexOf(item.key) > -1) {
                        this.$set(column, '__fixed__', false)
                    } else {
                        this.$set(column, '__fixed__', column.fixed || true)
                    }
                })
            },
            // 字段可见状态改变时触发
            handleFieldVisibleChange(value) {
                let columns = {
                    children: this.columns
                }
                this.fieldVisibleTransfer.value = value
                this.fieldVisibleTransfer.data.forEach(item => {
                    let column = columns
                    item.key.split('.').forEach(idx => {
                        column = column.children[idx]
                    })
                    if (value.indexOf(item.key) > -1) {
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
    display: flex;
    width: 100%;
    height: 100%;
    &.cell {
        padding: 3px;
        .cell {
            padding: 3px;
            &>.sy-layout {
                padding: 10px;
                border-radius: 2px;
                background: #fff;
            }
        }
    }
    .button-col {
        ::v-deep {
            .el-button,
            .filter-button {
                margin-bottom: 10px;
                & + .el-button,
                & + .filter-button {
                    margin-left: 10px;
                }
            }
        }
    }
    .filter-wrap {
        flex: 1;
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
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
    padding: 0 10px;
    ::v-deep {
        .el-tab-pane {
            padding: 10px 0;
        }
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
