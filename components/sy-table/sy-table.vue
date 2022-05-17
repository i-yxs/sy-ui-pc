<!--
* @description 表格
* @author yc
!-->
<template>
    <div
        v-if="!emptyDataHide || total > 0"
        class="sy-table"
        v-loading="loading"
        element-loading-text="拼命加载中"
        :style="{height: tableCacheHeight}"
    >
        <div class="table-main">
            <el-form
                ref="elForm"
                :model="formModel"
                class="table-form"
            >
                <el-table
                    ref="elTable"
                    v-if="tableRender"
                    v-bind="props"
                    v-on="$listeners"
                    @row-click="_handleRowClick"
                    @selection-change="_handleSelectionChange"
                >
                    <!-- 选择按钮 -->
                    <template v-if="selectable_">
                        <el-table-column
                            v-if="multiple"
                            :selectable="_selectable"
                            :resizable="false"
                            type="selection"
                            width="40"
                            fixed="left"
                            align="center"
                            header-align="center"
                        />
                        <el-table-column
                            v-else
                            fixed="left"
                            width="40"
                            align="center"
                            header-align="center"
                        >
                            <template slot-scope="{row}">
                                <el-radio
                                    :value="selectedRows_.indexOf(row) > -1"
                                    :label="true"
                                    :disabled="!_selectable(row)"
                                    class="table-radio"
                                />
                            </template>
                        </el-table-column>
                    </template>
                    <!-- 序号 -->
                    <el-table-column
                        v-if="serialNumber"
                        :label="serialNumberLabel"
                        :resizable="false"
                        :index="_getIndex"
                        type="index"
                        width="50"
                        fixed="left"
                        align="center"
                    />
                    <!-- 表格列 -->
                    <template v-for="(column, index) in columns">
                        <column-item
                            v-if="_getColumnVisible(column)"
                            :key="index"
                            :index="index"
                            :column="column"
                        />
                    </template>
                    <!-- 操作列 -->
                    <el-table-column
                        v-if="get2Function(operate_.visible)"
                        v-bind="operate_.props"
                    >
                        <template slot-scope="scope">
                            <slot v-bind="scope" name="operate">
                                <sy-dropdown>
                                    <template v-for="(item, index) in operate_.button">
                                        <div
                                            v-if="get2FunctionScope(item.visible, scope) !== false"
                                            :key="index"
                                            class="dropdown-item"
                                            @click="get2FunctionScope(item.onClick, scope)"
                                        >
                                            <el-dropdown-item divided :icon="item.icon">{{ item.label }}</el-dropdown-item>
                                        </div>
                                    </template>
                                </sy-dropdown>
                            </slot>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form>
        </div>
        <div class="table-foot" v-if="multiple || paginationVisible">
            <div class="selection" v-if="multiple">
                <span class="label">已选择 <span class="count">{{ selectedRows_.length }}</span> 项</span>
                <span
                    v-if="selectedRows_.length"
                    class="link-text"
                    @click="_handleCancelAllSelected"
                >取消全部</span>
            </div>
            <div class="pagination" v-if="paginationVisible">
                <el-pagination
                    v-bind="paginationProps_"
                    @size-change="_handlePageSizeChange"
                    @current-change="_handlePageIndexChange"
                />
            </div>
        </div>
    </div>
    <sy-empty v-else :text="emptyText" />
</template>

<script>
    // 方法
    import {
        isType,
        attrsToProps,
        get2Function,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    import ColumnItem from './ColumnItem'
    import ColumnStatus from './ColumnStatus'
    import SyDropdown from '../sy-dropdown/sy-dropdown'

    const NAME = 'sy-table'
    const booleanKeys = [
        'fit',
        'stripe',
        'border',
        'showHeader',
        'highlightCurrentRow',
        'defaultExpandAll',
        'showSummary',
        'selectOnIndeterminate',
        'lazy'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        components: {
            SyDropdown,
            ColumnItem,
            ColumnStatus
        },
        inheritAttrs: false,
        props: setPropsDefault({
            // 数据列表
            data: Array,
            // 数据总条目数据
            total: Number,
            // 列表配置
            columns: Array,
            // 操作列配置
            operate: Object,
            // 是否加载状态
            loading: Boolean,
            // 是否多选
            multiple: Boolean,
            // 表格行是否可选
            selectable: [Boolean, Function],
            // 是否显示序号
            serialNumber: { type: Boolean, default: true },
            // 序号标签文本
            serialNumberLabel: { type: String, default: '序号' },
            // 每页显示的数量
            pageSize: Number,
            // 当前页下标
            pageIndex: Number,
            // 当前高亮行
            currentRow: Object,
            // 自定义合计数据
            summaryData: Object,
            // 选中行列表
            selectedRows: Array,
            // 空数据时显示的文本内容，emptyDataHide为true时有效
            emptyText: { type: String, default: '暂无数据' },
            // 空数据时隐藏组件
            emptyDataHide: Boolean,
            // 分页器props
            paginationProps: Object,
            // 数据更新时触发重新渲染表格组件
            updatedReRender: Boolean,
            // 只有一页时是否隐藏分页器
            onePageHidePagination: Boolean
        }, NAME),
        data() {
            return {
                // 表格渲染状态，用于columns更新时，利用v-if重新实例化el-table组件
                tableRender: true,
                // 表格缓存高度
                tableCacheHeight: null,
                // 数据条目数缓存
                dataLengthCache: 0,
                // columns条目树缓存
                columnsLengthCache: 0
            }
        },
        computed: {
            props() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return {
                    data: this.data || [],
                    border: true,
                    rowKey: 'id',
                    stripe: true,
                    height: '100%',
                    maxHeight: '100%',
                    resizable: true,
                    summaryMethod: this._summaryMethod,
                    highlightCurrentRow: true,
                    ...props
                }
            },
            operate_() {
                let operate = this.operate || {}
                return {
                    ...operate,
                    props: {
                        label: '操作',
                        fixed: 'right',
                        align: 'center',
                        width: 55,
                        resizable: false,
                        ...operate.props
                    }
                }
            },
            formModel() {
                return {
                    row: this.data
                }
            },
            selectable_() {
                return !!this.selectable
            },
            selectedRows_() {
                return Array.isArray(this.selectedRows) ? this.selectedRows : []
            },
            pageSizes() {
                let sizes = [10, 20, 30, 50, 100, 200, 500, 1000, 2000]
                let pageSize = this.pageSize
                if (sizes.indexOf(pageSize) === -1) {
                    sizes.splice(0, 0, pageSize)
                }
                return sizes.sort((a, b) => a - b)
            },
            paginationProps_() {
                return {
                    layout: 'total, sizes, prev, pager, next, jumper',
                    pageSizes: this.pageSizes,
                    background: true,
                    ...this.paginationProps,
                    total: this.total,
                    pageSize: this.pageSize,
                    currentPage: this.pageIndex
                }
            },
            // 分页器显示状态
            paginationVisible() {
                if (this.onePageHidePagination && this.total <= this.pageSize) {
                    return false
                }
                return true
            }
        },
        watch: {
            data: {
                deep: true,
                handler(data) {
                    let length = data.length
                    if (this.updatedReRender && this.dataLengthCache !== length) {
                        this.reRenderTable()
                    }
                    this.dataLengthCache = length
                    this._updateSelectedRows()
                }
            },
            columns: {
                deep: true,
                handler(columns) {
                    let length = columns.length
                    if (this.updatedReRender && this.columnsLengthCache !== length) {
                        this.reRenderTable()
                    }
                    this.columnsLengthCache = length
                }
            },
            multiple: 'reRenderTable',
            currentRow: {
                deep: true,
                handler(row) {
                    if (this.$refs.elTable) {
                        this.$refs.elTable.setCurrentRow(row)
                    }
                }
            },
            selectedRows: {
                deep: true,
                handler() {
                    this._updateSelectedRows()
                }
            }
        },
        mounted() {
            this._updateSelectedRows()
        },
        updated() {
            this.doLayout()
        },
        methods: {
            get2Function,
            get2FunctionScope(value, scope) {
                let { row, $index } = scope
                let params = { row, index: this._getIndex($index) - 1 }
                return get2Function(value, params)
            },
            // el-table组件重新布局
            doLayout() {
                let elTable = this.$refs.elTable
                if (elTable) {
                    // el-table组件的重新布局的函数
                    elTable.doLayout()
                    // el-table组件内部更新滚动位置的计算函数，用于更新左右固定列的阴影显示状态
                    elTable.syncPostion()
                }
            },
            // 对整个表单进行校验
            validate(showMessage = true) {
                return new Promise((resolve, reject) => {
                    this.clearValidate()
                    this.$nextTick(() => {
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
                })
            },
            // 对指定行进行校验
            validateRows(rows, showMessage = true) {
                return new Promise((resolve, reject) => {
                    if (rows.length) {
                        this.clearValidate()
                        this.$nextTick(() => {
                            // 找出所有配置了校验规则的prop
                            let props = this.columns.filter(column => Array.isArray(column.rules)).map(column => column.prop)
                            // 找出需要校验数据的下标
                            let indexs = rows.map(row => this.data.indexOf(row)).filter(index => index > -1)
                            if (props.length && indexs.length) {
                                let promises = []
                                indexs.forEach(index => {
                                    props.forEach(key => {
                                        promises.push(this.validateField(`row.${index}.${key}`, false))
                                    })
                                })
                                Promise.all(promises).then(resolve).catch((err) => {
                                    if (showMessage) {
                                        this.$message.warning(err[0])
                                    }
                                    reject(err)
                                })
                            } else {
                                resolve()
                            }
                        })
                    } else {
                        resolve()
                    }
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
                this.$refs.elForm && this.$refs.elForm.resetFields()
            },
            // 移除表单项的校验结果
            clearValidate(props) {
                this.$refs.elForm && this.$refs.elForm.clearValidate(props)
            },
            // 重新渲染表格组件
            reRenderTable() {
                this.tableRender = false
                this.tableCacheHeight = this.$el.clientHeight + 'px'
                this.$nextTick(() => {
                    this.tableRender = true
                    this.$nextTick(() => {
                        this.tableCacheHeight = ''
                        this._updateSelectedRows()
                    })
                })
            },
            // 获取当前视图数据相对于当前页数的下标
            _getIndex(index) {
                return this.pageSize * (this.pageIndex - 1) + index + 1
            },
            // 表格行是否可选
            _selectable(row) {
                if (isType(this.selectable, 'function')) {
                    return this.selectable(row)
                }
                return !!this.selectable
            },
            // 计算合计
            _summaryMethod({ columns, data }) {
                let sums = []
                let lableIndex = this.columns.findIndex(v => v.summaryLable)
                if (lableIndex === -1) {
                    lableIndex = 1
                }
                columns.forEach(({ property }, index) => {
                    if (index === lableIndex) {
                        // 合计栏lable文本
                        sums[index] = this.columns[lableIndex].summaryLable || '合计'
                    }
                    let column = this.columns.find(v => v.prop === property)
                    if (column) {
                        let {
                            summaryType = '',
                            summaryPrefix = '',
                            summarySuffix = ''
                        } = column
                        if (column.summary) {
                            let summaryData = this.summaryData
                            if (summaryData && typeof summaryData === 'object') {
                                // 自定义合计数据
                                let summaryKey = column.summaryKey || column.prop
                                sums[index] = summaryData[summaryKey]
                                if (column.type === 'money') {
                                    // 金额类型处理
                                    sums[index] = moneyFormat(sums[index], column.precision)
                                }
                                sums[index] = summaryPrefix + sums[index] + summarySuffix
                            } else {
                                // 计算列表合计
                                let values = data.map(item => Number(item[column.prop]))
                                if (!values.every(value => isNaN(value))) {
                                    sums[index] = values.reduce((prev, curr) => {
                                        return !isNaN(Number(curr)) ? prev + curr : prev
                                    }, 0)
                                    // 合计类型处理
                                    switch (summaryType) {
                                    case 'average':
                                        // 平均值
                                        sums[index] = (sums[index] / values.length).toFixed(2)
                                        break
                                    }
                                    if (column.type === 'money') {
                                        // 金额类型处理
                                        sums[index] = moneyFormat(sums[index], column.precision)
                                    }
                                    sums[index] = summaryPrefix + sums[index] + summarySuffix
                                } else {
                                    sums[index] = '- -'
                                }
                            }
                        }
                    }
                })
                return sums
            },
            // 获取表格列的可见状态
            _getColumnVisible(column) {
                return get2Function(column.visible, column) !== false && get2Function(column.__visible__, column) !== false
            },
            // 获取指定行位于选中列表内的下标
            _getSelectedRowIndex(row) {
                let { rowKey } = this.props
                return this.selectedRows_.findIndex(v => v[rowKey] === row[rowKey])
            },
            // 更新选中行
            _updateSelectedRows() {
                this.$nextTick(() => {
                    if (this.$refs.elTable) {
                        if (Array.isArray(this.data)) {
                            this.data.forEach(row => {
                                let bool = this._getSelectedRowIndex(row) > -1
                                this.$refs.elTable.toggleRowSelection(row, bool)
                            })
                        }
                        if (!this.multiple && this.selectedRows_.length) {
                            this.$refs.elTable.setCurrentRow(this.selectedRows_[0])
                        }
                    }
                })
            },
            // 页大小改变时触发
            _handlePageSizeChange(size) {
                this.$emit('update:pageIndex', 1)
                this.$emit('update:pageSize', size)
                this.$emit('page-change')
            },
            // 页下标改变时触发
            _handlePageIndexChange(index) {
                this.$emit('update:pageIndex', index)
                this.$emit('page-change')
            },
            // 点击列表行时触发
            _handleRowClick(row) {
                if (this._selectable(row)) {
                    let selectedRows = this.selectedRows || []
                    if (this.multiple) {
                        // 多选时点击行切换选中状态用户体验不太好，所以这个功能先搁置
                        // let index = this._getSelectedRowIndex(row)
                        // if (index > -1) {
                        //     selectedRows.splice(index, 1)
                        //     this.$refs.elTable.toggleRowSelection(row, false)
                        // } else {
                        //     selectedRows.push(row)
                        //     this.$refs.elTable.toggleRowSelection(row, true)
                        // }
                    } else {
                        selectedRows = [row]
                    }
                    this.$refs.elTable.setCurrentRow(row)
                    this.$emit('update:selectedRows', selectedRows)
                }
                this.$emit('update:currentRow', row)
            },
            // 当选择项发生变化时触发
            _handleSelectionChange(selection) {
                clearTimeout(this.selectionTimer)
                this.selectionTimer = setTimeout(() => {
                    // 去掉当前视图所有缓存选中行
                    let { rowKey } = this.props
                    let selectedRows = this.selectedRows || []
                    selectedRows = selectedRows.filter(row => {
                        return this.data.findIndex(v => v[rowKey] === row[rowKey]) === -1
                    })
                    selectedRows = selectedRows.concat(selection)
                    this.$emit('update:selectedRows', selectedRows)
                }, 300)
            },
            // 取消全部选中项
            _handleCancelAllSelected() {
                let selectedRows = []
                this.$emit('update:selectedRows', selectedRows)
                this.$refs.elTable.clearSelection()
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-table {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    .table-main {
        flex: 1;
        overflow: hidden;
        .el-table {
            height: 100%;
        }
    }
    .table-foot {
        display: flex;
        align-items: center;
        margin-top: 10px;
        .selection {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            line-height: 32px;
            font-size: 14px;
            color: #666;
            min-width: 150px;
            .label {
                margin-right: 10px;
            }
            .count {
                color: #409EFF;
            }
        }
        .pagination {
            flex: 1;
            .el-pagination {
                text-align: right;
            }
        }
    }
    .table-form {
        width: 100%;
        height: 100%;
        ::v-deep {
            .el-table .cell-col > .el-form-item {
                margin-bottom: 0!important;
                & > .el-form-item__content {
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }
                .el-form-item__error {
                    display: none;
                }
            }
        }
    }
    .column-status {
        &.dot {
            display: inline-flex;
            align-items: center;
            .dot {
                display: inline-block;
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #ececec;
            }
            .label {
                font-size: 13px;
                color: #777;
                margin-left: 8px;
            }
        }
        &.block {
            display: inline-block;
            color: #fff;
            background: #c5c5c5;
            text-align: center;
            line-height: 22px;
            border-radius: 11px;
            padding: 0 10px;
            font-size: 12px;
            min-width: 56px;
        }
    }
    ::v-deep {
        .el-table {
            .el-table--border {
                border: 1px solid #efefef;
            }
            table {
                border-collapse: separate;
            }
            thead {
                color: #333;
                font-weight: initial;
                td,
                th {
                    padding: 0;
                    background: #f3f3f3;
                }
                .cell {
                    height: 40px;
                }
            }
            tbody {
                td,
                th {
                    padding: 0;
                }
                // .el-table-column--selection {
                //     cursor: pointer;
                //     .el-checkbox {
                //         pointer-events: none;
                //     }
                // }
            }
            .el-table__footer {
                td,
                th{
                    background: #edf5ff;
                }
                .cell {
                    height: 40px;
                }
            }
            .cell {
                position: relative;
                height: 36px;
                display: flex;
                align-items: center;
                line-height: initial;
                padding-left: 10px;
                padding-right: 10px;
                .el-table__indent,
                .el-table__expand-icon,
                .el-table__placeholder {
                    display: inline-block;
                }
            }
            .link {
                cursor: pointer;
                color: #409eff;
                &:hover {
                    text-decoration: underline
                }
            }
            .cell-col {
                width: 100%;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .is-right {
                .cell {
                    justify-content: flex-end;
                }
            }
            .is-center {
                .cell {
                    justify-content: center;
                }
            }
            //解决同时设置了show-summary和fixed后，fixed部分会挡住滚动条，使处于fixed的部分滚动条无法拖动
            .el-table__fixed,
            .el-table__fixed-right {
                pointer-events: none;
                .el-table__fixed-header-wrapper,
                .el-table__fixed-body-wrapper,
                .el-table__fixed-footer-wrapper {
                    pointer-events: initial;
                }
            }
            // 选中行样式
            .el-table__body tr.current-row > td,
            .el-table__body tr.current-row:hover{
                background: #edf5ff;
            }
            .table-radio {
                .el-radio__label {
                    display: none;
                }
            }
        }
    }
}
</style>
