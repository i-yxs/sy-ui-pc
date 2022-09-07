<!--
* @description 表格配置
* @author yc
!-->
<template>
    <div class="sy-table-config sy-layout flex column">
        <sy-layout-filter
            v-bind="filters_"
            :params="params"
            :columns="tableProps.columns"
            @clear="clearParams"
            @reset="resetParams"
            @filter="rerequestData"
        >
            <sy-table
                ref="syTable"
                v-bind="tableProps"
                :total="total"
                :loading="loading"
                :pageSize.sync="pageSize"
                :pageIndex.sync="pageIndex"
                v-on="$listeners"
                @sort-change="_handleSortChange"
                @update:pageSize="_updatePageParam"
                @update:pageIndex="_updatePageParam"
            />
            <slot name="top" slot="top" />
            <slot name="left" slot="left" />
            <slot name="right" slot="right" />
            <slot name="bottom" slot="bottom" />
            <slot name="middle" slot="middle" />
        </sy-layout-filter>
        <div>
            <slot />
        </div>
    </div>
</template>

<script>
    // 方法
    import {
        isType,
        isEmpty,
        deepMerge,
        filterList,
        getProperty,
        attrsToProps,
        isValidNumber,
        limitedPromise,
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    import SyTable from '../sy-table/sy-table'
    import SyLayoutFilter from '../sy-layout-filter/sy-layout-filter'

    const NAME = 'sy-table-config'
    const booleanKeys = [
        'loading',
        'remMode',
        'multiple',
        'selectable',
        'serialNumber'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        components: {
            SyTable,
            SyLayoutFilter
        },
        inheritAttrs: false,
        props: setPropsDefault({
            // 自定义列表数据
            data: Array,
            // 其他请求参数
            params: { type: Object, require: true },
            // 数据请求配置
            request: [Object, Function],
            // 加载状态
            loading: Boolean,
            // 按钮
            buttons: Array,
            // 筛选项配置
            filters: { type: Object, require: true },
            // 组件准备就绪是否立刻请求
            immediately: { type: Boolean, default: true }
        }, NAME),
        data() {
            let {
                orderBy,
                pageSize,
                pageIndex
            } = this.params || {}
            return {
                total: 0,
                orderBy: orderBy,
                pageSize: pageSize || 15,
                pageIndex: pageIndex || 1,
                summaryData: null,
                dataToRequest: null
            }
        },
        computed: {
            props() {
                return attrsToProps(this.$attrs, booleanKeys)
            },
            filters_() {
                return {
                    // 工具栏显示状态
                    toolbar: true,
                    ...this.filters,
                    buttons: this.buttons,
                    remMode: this.tableProps.remMode
                }
            },
            tableProps() {
                let data = Array.isArray(this.dataToRequest) ? this.dataToRequest : this.data
                return {
                    serialNumber: true,
                    ...this.props,
                    data,
                    summaryData: this.summaryData
                }
            }
        },
        watch: {
            data: '_requestData',
            'params.orderBy'(value) {
                if ('orderBy' in this.params) {
                    this.orderBy = value
                }
            },
            'params.pageSize'(value) {
                if ('pageSize' in this.params) {
                    this.pageSize = value
                }
            },
            'params.pageIndex'(value) {
                if ('pageIndex' in this.params) {
                    this.pageIndex = value
                }
            },
            'props.summaryData'() {
                this.calcSummary(this.data)
            }
        },
        mounted() {
            if (this.immediately) {
                this._requestData()
            }
            this.$emit('ready', this)
            this.$watch('data', this.calcSummary, {
                deep: true
            })
            this.setDefaultParams(this.params)
        },
        methods: {
            // 重置筛选条件并请求数据
            resetParams() {
                let { filters = [], foldeds = [] } = this.filters_;
                [
                    ...filters,
                    ...foldeds
                ].forEach(item => {
                    switch (isType(item.bindProps)) {
                    case 'array':
                        item.bindProps.forEach(key => {
                            this.$set(this.params, key, this.defaultParams[key])
                        })
                        break
                    case 'object':
                        Object.keys(item.bindProps).forEach(key => {
                            this.$set(this.params, key, this.defaultParams[key])
                        })
                        break
                    }
                    this.$set(this.params, item.prop, this.defaultParams[item.prop])
                })
                this.$emit('update:selectedRows', [])
                this._updatePageParam()
            },
            // 清空筛选条件并请求数据
            clearParams() {
                let { filters = [], foldeds = [] } = this.filters_;
                [
                    ...filters,
                    ...foldeds
                ].forEach(item => {
                    switch (isType(item.bindProps)) {
                    case 'array':
                        item.bindProps.forEach(key => {
                            delete this.params[key]
                        })
                        break
                    case 'object':
                        Object.keys(item.bindProps).forEach(key => {
                            delete this.params[key]
                        })
                        break
                    }
                    delete this.params[item.prop]
                })
                this.orderBy = ''
                this.pageIndex = 1
                this.$emit('update:selectedRows', [])
                this._updatePageParam()
            },
            // 计算合计
            calcSummary(data = this.data) {
                if (this.props.showSummary) {
                    if (isType(this.props.summaryData, 'object')) {
                        this.summaryData = this.props.summaryData
                    } else {
                        if (this.props.summaryData === true && Array.isArray(data)) {
                            let columns = []
                            let summaryData = {}
                            let recursion = (column) => {
                                if (Array.isArray(column.children)) {
                                    column.children.forEach(recursion)
                                } else {
                                    columns.push(column)
                                }
                            }
                            this.tableProps.columns.forEach(recursion)
                            columns.forEach(column => {
                                if (column.summary) {
                                    summaryData[column.prop] = data.reduce((a, b) => {
                                        let value = Number(getProperty(b, column.prop))
                                        if (isValidNumber(value)) {
                                            return a + value
                                        }
                                        return a
                                    }, 0)
                                }
                            })
                            this.summaryData = summaryData
                        } else {
                            this.summaryData = null
                        }
                    }
                }
            },
            // 只刷新数据，不会重置数据
            refreshData() {
                this._updatePageParam()
            },
            // 重新请求数据
            rerequestData() {
                this.pageIndex = 1
                this.$emit('update:currentRow', null)
                this.$nextTick(() => {
                    this._updatePageParam()
                })
            },
            // 设置默认参数
            setDefaultParams(params) {
                this.defaultParams = deepMerge({}, params)
            },
            // 对整个表单进行校验
            validate(showMessage) {
                return this.$refs.syTable && this.$refs.syTable.validate(showMessage)
            },
            // 对指定列进行校验
            validateRows(rows) {
                return this.$refs.syTable && this.$refs.syTable.validateRows(rows)
            },
            // 对部分表单字段进行校验
            validateField(props, showMessage) {
                return this.$refs.syTable && this.$refs.syTable.resetFields(props, showMessage)
            },
            // 重置表单
            resetFields() {
                this.$refs.syTable && this.$refs.syTable.resetFields()
            },
            // 移除表单项的校验结果
            clearValidate(props) {
                this.$refs.syTable && this.$refs.syTable.clearValidate(props)
            },
            // 根据请求配置获取选项数据
            async _requestData(option) {
                option = {
                    limitedTime: 300,
                    ...option
                }
                let isRequest = ['object', 'function'].includes(isType(this.request))
                let isLocalData = Array.isArray(this.data)
                if (isRequest || isLocalData) {
                    if (!isRequest && isLocalData && this.data.length === 0) {
                        this.total = 0
                        this.dataToRequest = []
                        return
                    }
                    let currentRow = this.tableProps.currentRow
                    this.$emit('update:loading', true)
                    this.$emit('update:currentRow', null)
                    this.dataToRequest = []
                    if (isRequest) {
                        if (!isType(this.$request, 'function')) {
                            return console.error('请在vue原型链中注入$request请求方法')
                        }
                        try {
                            let params = {
                                ...this.params,
                                orderBy: this.orderBy,
                                pageSize: this.pageSize,
                                pageIndex: this.pageIndex
                            }
                            if (isType(this.request, 'object')) {
                                // 接口地址方式请求数据
                                let { url, method, dataKey } = this.request
                                if (isEmpty(dataKey)) {
                                    dataKey = method.toLocaleLowerCase() === 'get' ? 'params' : 'data'
                                }
                                let data = await limitedPromise(this.$request({
                                    url,
                                    method,
                                    [dataKey]: params
                                }))
                                this.$emit('requested', data)
                                this._getDataToResponse(data)
                            } else {
                                // 自定义函数，自定义函数返回值必须是Promise对象
                                let data = await limitedPromise(this.request(params), option.limitedTime)
                                this.$emit('requested', data)
                                this._getDataToResponse(data)
                            }
                        } catch (err) {
                            console.error(err)
                            this.$emit('request-error', err)
                        }
                    } else if (isLocalData) {
                        let dataList = this.data || []
                        let { filters = [], foldeds = [] } = this.filters_
                        filters = [...filters, ...foldeds]
                        if (filters.length) {
                            dataList = filterList(
                                dataList,
                                this.params,
                                filters.map(item => {
                                    return {
                                        prop: item.prop,
                                        type: item.filterType || 'string'
                                    }
                                })
                            )
                        }
                        this.total = dataList.length
                        this.calcSummary(dataList)
                        dataList = dataList.slice((this.pageIndex - 1) * this.pageSize, this.pageIndex * this.pageSize)
                        this.$emit('data-change', dataList)
                        this.dataToRequest = dataList
                    }
                    // 更新高亮行
                    if (currentRow) {
                        let rowKey = this.tableProps.rowKey
                        currentRow = this.dataToRequest.find(row => {
                            return row[rowKey] === currentRow[rowKey]
                        })
                    }
                    this.$emit('update:currentRow', currentRow || this.dataToRequest[0])
                    this.$emit('update:loading', false)
                }
            },
            // 更新分页参数
            _updatePageParam() {
                this.$set(this.params, 'pageSize', this.pageSize)
                this.$set(this.params, 'pageIndex', this.pageIndex)
                clearTimeout(this.requestTimer)
                this.requestTimer = setTimeout(this._requestData, 100)
                this.$emit('change')
            },
            // 获取响应值内的数据
            _getDataToResponse(data) {
                if (isType(data, 'object')) {
                    if (Array.isArray(data.records)) {
                        this.total = data.total
                        this.dataToRequest = data.records
                    } else {
                        return this._getDataToResponse(data.data)
                    }
                } else {
                    this.total = 0
                    this.dataToRequest = []
                }
            },
            // 表格的排序条件发生变化的时触发
            _handleSortChange({ prop, order }) {
                let { columns } = this.tableProps
                if (Array.isArray(columns)) {
                    let column = columns.find(column => column.prop === prop)
                    let sortField = isEmpty(column.dbProp) ? `c_${prop.replace(/([A-Z])/, '_$1').toLocaleLowerCase()}` : column.dbProp
                    this.orderBy = `${sortField} ${order === 'descending' ? 'desc' : 'asc'}`
                    this.rerequestData()
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-table-config {
    width: 100%;
    height: 100%;
}
</style>
