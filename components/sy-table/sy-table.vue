<!--
* @description 表格
* @author yc
!-->
<template>
    <div
        v-if="!emptyDataHide || total > 0"
        class="sy-table"
        v-loading="loading"
        :element-loading-text="loadingProps_.text"
        :element-loading-spinner="loadingProps_.spinner"
        :element-loading-background="loadingProps_.background"
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
                            :width="rem40"
                            :resizable="false"
                            :selectable="_selectable"
                            type="selection"
                            fixed="left"
                            align="center"
                            header-align="center"
                        />
                        <el-table-column
                            v-else
                            :width="rem40"
                            fixed="left"
                            align="center"
                            header-align="center"
                        >
                            <template slot-scope="{row}">
                                <el-radio
                                    :value="_selected(row)"
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
                        :width="_getRealWidth(serialNumberWidth)"
                        :label="serialNumberLabel"
                        :resizable="false"
                        :index="_getIndex"
                        type="index"
                        fixed="left"
                        align="center"
                    />
                    <!-- 表格列 -->
                    <template v-for="(column, index) in columns">
                        <sy-column-item
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
                                <sy-dropdown
                                    :scope="scope"
                                    :options="operate_.button"
                                    @click="(item) => get2Function(item.onClick, scope)"
                                />
                            </slot>
                        </template>
                    </el-table-column>
                </el-table>
            </el-form>
        </div>
        <div class="table-foot">
            <div class="selection" v-if="selectedInfo && multiple">
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
        isEmpty,
        remToPx,
        getProperty,
        attrsToProps,
        get2Function,
        toLocaleString,
        differenceMerge,
        hyphenationToCamel,
        isValidNumber
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    import SyColumnItem from './SyColumnItem'
    import SyColumnStatus from './SyColumnStatus'
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
            SyColumnItem,
            SyColumnStatus
        },
        inheritAttrs: false,
        props: setPropsDefault({
            // 数据列表
            data: Array,
            // 数据总条目数据
            total: Number,
            // rem模式
            remMode: Boolean,
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
            // 序号标签宽度
            serialNumberWidth: { type: [Number, String], default: 60 },
            // 每页显示的数量
            pageSize: Number,
            // 当前页下标
            pageIndex: Number,
            // 空数据时显示的文本内容，emptyDataHide为true时有效
            emptyText: { type: String, default: '暂无数据' },
            // 当前高亮行
            currentRow: Object,
            // 自定义合计数据
            summaryData: Object,
            // 选中行列表
            selectedRows: Array,
            // 多选时是否显示已选信息栏
            selectedInfo: { type: Boolean, default: true },
            // element-loading
            loadingProps: Object,
            // 空数据时隐藏组件
            emptyDataHide: Boolean,
            // 分页器props
            paginationProps: Object,
            // 数据更新时触发重新渲染表格组件
            updatedReRender: Boolean,
            // 自定义权限检查函数
            checkAccessMethod: Function,
            // 只有一页时是否隐藏分页器
            onePageHidePagination: Boolean
        }, NAME),
        data() {
            return {
                rem40: 40,
                rem60: 60,
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
                let data = this.data || []
                return {
                    data,
                    border: true,
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
                let rows = []
                let {
                    children = 'children',
                    hasChildren = 'hasChildren'
                } = this.props.treeProps || {}
                // 平铺数据
                let recursion = (data) => {
                    if (Array.isArray(data)) {
                        data.forEach(row => {
                            rows.push(row)
                            if (row[hasChildren] !== false) {
                                recursion(row[children])
                            }
                        })
                    }
                }
                recursion(this.data)
                return {
                    rows
                }
            },
            pageSizes() {
                let sizes = [10, 20, 30, 50, 100, 200, 500, 1000, 2000]
                let pageSize = this.pageSize
                if (sizes.indexOf(pageSize) === -1) {
                    sizes.splice(0, 0, pageSize)
                }
                return sizes.sort((a, b) => a - b)
            },
            selectable_() {
                return !!this.selectable
            },
            selectedRows_() {
                return Array.isArray(this.selectedRows) ? this.selectedRows : []
            },
            loadingProps_() {
                return {
                    text: '拼命加载中',
                    ...this.loadingProps
                }
            },
            paginationProps_() {
                return {
                    show: true,
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
                if (!this.paginationProps_.show) return false
                if (this.onePageHidePagination) {
                    if (!this.total || this.total <= this.pageSize) return false
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
                    this.updatingSummary()
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
            summaryData: {
                deep: true,
                handler() {
                    this.updatingSummary()
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
            this._onResize()
            this._updateSelectedRows()
            window.addEventListener('resize', this._onResize)
        },
        updated() {
            this.doLayout()
        },
        destroyed() {
            window.removeEventListener('resize', this._onResize)
        },
        methods: {
            get2Function,
            // 检查操作按钮的权限
            checkAccessToOperate(scope) {
                return (value) => {
                    return this.checkAccessMethod(value)
                }
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
            // 强制更新合计栏
            updatingSummary() {
                let elTable = this.$refs.elTable
                if (elTable) {
                    elTable.$children.forEach(children => {
                        if (children.$options.name === 'ElTableFooter') {
                            children.$forceUpdate()
                        }
                    })
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
            // 浏览器窗口大小改变时触发
            _onResize() {
                if (this.remMode) {
                    this.rem40 = remToPx(40)
                    this.rem60 = remToPx(60)
                } else {
                    this.rem40 = 40
                    this.rem60 = 60
                }
            },
            // 表格行是否选中
            _selected(row) {
                let { rowKey } = this.props
                return this.selectedRows_.findIndex(v => v[rowKey] === row[rowKey]) > -1
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
            // 根据prop获取原始column
            _getColumn(prop, columns = this.columns) {
                let length = columns.length
                for (let i = 0; i < length; i++) {
                    if (columns[i].prop === prop) {
                        return columns[i]
                    }
                    if (Array.isArray(columns[i].children)) {
                        let column = this._getColumn(prop, columns[i].children)
                        if (column) {
                            return column
                        }
                    }
                }
            },
            // 计算合计
            _summaryMethod({ columns, data }) {
                columns = columns.map(({ property }) => {
                    return this._getColumn(property)
                })
                let sums = columns.map((column) => {
                    if (column) {
                        if (column.summaryLable) return column.summaryLable
                        if (column && column.summary) {
                            let value = '- -'
                            let {
                                summaryType = '',
                                summaryPrefix = '',
                                summarySuffix = ''
                            } = column
                            let summaryData = this.summaryData
                            if (summaryData && typeof summaryData === 'object') {
                                // 自定义合计数据
                                let summaryKey = column.summaryKey || column.prop
                                if (isValidNumber(summaryData[summaryKey])) {
                                    value = Number(summaryData[summaryKey].toFixed(column.precision || 2))
                                    value = toLocaleString(value, 0, column.precision)
                                    value = summaryPrefix + value + summarySuffix
                                }
                            } else {
                                // 计算列表合计
                                let values = data.map(item => Number(getProperty(item, column.prop)))
                                if (!values.every(value => isNaN(value))) {
                                    value = values.reduce((prev, curr) => {
                                        return !isNaN(Number(curr)) ? prev + curr : prev
                                    }, 0)
                                    // 合计类型处理
                                    switch (summaryType) {
                                    case 'average':
                                        // 平均值
                                        value = value / values.length
                                        break
                                    }
                                    value = Number(value.toFixed(column.precision || 2))
                                    value = toLocaleString(value, 0, column.precision)
                                    value = summaryPrefix + value + summarySuffix
                                }
                            }
                            return value
                        }
                    }
                    return ''
                })
                // 如果没有列任何定义summaryLable属性，则默认在第一列显示
                if (this.columns.findIndex(v => v.summaryLable) === -1) {
                    sums[this.serialNumber ? 1 : 0] = '合计'
                }
                return sums
            },
            // 获取表格列的固定状态
            _getColumnFixed(column) {
                let __fixed__ = get2Function(column.__fixed__, column)
                if (isEmpty(__fixed__)) {
                    return get2Function(column.fixed, column)
                }
                return __fixed__
            },
            // 获取表格列宽度
            _getRealWidth(width) {
                if (isEmpty(width)) return width
                if (this.remMode) {
                    return remToPx(width)
                }
                return width
            },
            // 获取表格列的可见状态
            _getColumnVisible(column) {
                let { visible, accessKey, __visible__ } = column
                if (get2Function(visible, column) !== false && get2Function(__visible__, column) !== false) {
                    if (typeof this.checkAccessMethod === 'function') {
                        accessKey = get2Function(accessKey, column)
                        if (accessKey) return this.checkAccessMethod(accessKey)
                    }
                    return true
                }
                return false
            },
            // 获取指定行位于选中列表内的下标
            _getSelectedRowIndex(row) {
                let { rowKey } = this.props
                return this.selectedRows_.findIndex(v => v[rowKey] === row[rowKey])
            },
            // 更新选中行
            _updateSelectedRows() {
                this.$nextTick(() => {
                    if (this.selectable && Array.isArray(this.data)) {
                        let { rowKey } = this.props
                        let elTable = this.$refs.elTable
                        if (elTable) {
                            if (this.multiple) {
                                let states = elTable.store.states
                                let changed = true
                                let selectedRows = []
                                this.selectedRows_.forEach(row => {
                                    let index = this.data.findIndex(v => v[rowKey] === row[rowKey])
                                    if (index > -1) {
                                        selectedRows.push(this.data[index])
                                    }
                                })
                                /**
                                 * 因为el-table组件没有提供批量改变选中状态的api，
                                 * 所以初始更新选中行时只能逐行更新，由此导致会重复触发selection-change事件
                                 * 这里直接操作el-table实例，来实现批量改变选中状态
                                 */
                                states.selection = Array.isArray(states.selection) ? states.selection : []
                                if (states.selection.length === selectedRows.length) {
                                    changed = selectedRows.findIndex(row => states.selection.indexOf(row) === -1) > -1
                                }
                                if (changed) {
                                    states.selection = selectedRows
                                    elTable.store.updateAllSelected(selectedRows)
                                    this._handleSelectionChange(selectedRows)
                                }
                            } else {
                                if (this.selectedRows_.length) {
                                    let row = this.selectedRows_[0]
                                    row = this.data.find(v => v[rowKey] === row[rowKey])
                                    if (row) {
                                        this.$refs.elTable.setCurrentRow(row)
                                    }
                                }
                            }
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
                if (this.selectable) {
                    if (this._selectable(row)) {
                        let selectedRows = this.selectedRows || []
                        if (this.multiple) {
                            // 多选时点击行切换选中状态用户体验不太好，所以这个功能先搁置
                        } else {
                            selectedRows = [row]
                            this.$emit('update:selectedRows', selectedRows)
                        }
                        this.$refs.elTable.setCurrentRow(row)
                    } else {
                        this.$message.warning('该数据已被选择或不能被选择')
                    }
                }
                this.$emit('update:currentRow', row)
            },
            // 当选择项发生变化时触发
            _handleSelectionChange(selection) {
                // 去掉当前视图所有缓存选中行
                let { rowKey } = this.props
                let selectedRows = this.selectedRows || []
                selectedRows = selectedRows.filter(row => {
                    return this.data.findIndex(v => v[rowKey] === row[rowKey]) === -1
                })
                selectedRows = selectedRows.concat(selection)
                this.$emit('update:selectedRows', selectedRows)
            },
            // 取消全部选中项
            _handleCancelAllSelected() {
                let selectedRows = []
                this.$emit('update:selectedRows', selectedRows)
                this.$refs.elTable.clearSelection()
            },
            // 操作列按钮点击时触发
            _handleOperateButtonClick({ scope, option }) {
                get2Function(option.onClick, scope)
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
        .selection {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            line-height: 32px;
            font-size: 14px;
            color: #666;
            min-width: 150px;
            margin-top: 10px;
            .label {
                margin-right: 10px;
            }
            .count {
                color: #409EFF;
            }
        }
        .pagination {
            flex: 1;
            margin-top: 10px;
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
                    position: relative;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    padding: 0 10px;
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
            font-size: 12px;
            min-width: 56px;
        }
    }
    ::v-deep {
        .el-table {
            .el-table__row.expanded {
                color: inherit;
            }
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
                    padding: 0 10px;
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
            .is-hidden {
                visibility: hidden;
            }
            .el-table__footer {
                td,
                th{
                    background: #f3f3f3;
                }
                .cell {
                    height: 40px;
                    padding: 0 10px;
                }
            }
            .cell {
                position: relative;
                height: 36px;
                display: flex;
                align-items: center;
                line-height: initial;
                padding-left: 0;
                padding-right: 0;
                .el-table__indent,
                .el-table__expand-icon,
                .el-table__placeholder {
                    flex-shrink: 0;
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
                .cell,
                .sy-switch {
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
