<!--
* @description 表格配置
* @author yc
!-->
<template>
    <div class="sy-table-config sy-layout flex">
        <div class="sy-layout">
            <slot name="top" />
        </div>
        <div class="sy-layout flex auto">
            <div class="sy-layout">
                <slot name="left" />
            </div>
            <div class="sy-layout auto">
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
                        :pageSize.sync="pageSize"
                        :pageIndex.sync="pageIndex"
                        v-on="$listeners"
                        @sort-change="_handleSortChange"
                        @update:pageSize="_updatePageParam"
                        @update:pageIndex="_updatePageParam"
                        @update:currentRow="$emit('update:currentRow', $event)"
                        @update:selectedRows="$emit('update:selectedRows', $event)"
                    />
                </sy-layout-filter>
            </div>
            <div class="sy-layout">
                <slot name="right" />
            </div>
        </div>
        <div class="sy-layout">
            <slot name="bottom" />
        </div>
    </div>
</template>

<script>
    // 方法
    import {
        isType,
        isEmpty,
        filterList,
        attrsToProps,
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
            filters: { type: Object, require: true }
        }, NAME),
        data() {
            return {
                total: 0,
                loading_: false,
                orderBy: '',
                pageSize: 15,
                pageIndex: 1,
                dataToRequest: null
            }
        },
        computed: {
            filters_() {
                return {
                    // 工具栏显示状态
                    toolbar: true,
                    ...this.filters,
                    buttons: this.buttons
                }
            },
            tableProps() {
                let props = attrsToProps(this.$attrs, booleanKeys)
                let data = Array.isArray(this.dataToRequest) ? this.dataToRequest : this.data
                return {
                    serialNumber: true,
                    ...props,
                    data,
                    total: this.total,
                    loading: this.loading_
                }
            }
        },
        watch: {
            loading(value) {
                this.loading_ = value
            }
        },
        mounted() {
            this.$watch('request', this.rerequestData, { deep: true })
            this._requestData()
            this.setDefaultParams(this.params)
        },
        methods: {
            // 重置筛选条件并请求数据
            resetParams() {
                Object.keys(this.params).forEach(key => {
                    this.$set(this.params, key, this.defaultParams[key])
                })
                this.$emit('update:selectedRows', [])
                this._updatePageParam()
            },
            // 清空筛选条件并请求数据
            clearParams() {
                Object.keys(this.params).forEach(key => {
                    delete this.params[key]
                })
                this.orderBy = ''
                this.pageIndex = 1
                this.$emit('update:selectedRows', [])
                this._updatePageParam()
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
                this.defaultParams = JSON.parse(JSON.stringify(params))
            },
            // 对整个表单进行校验
            validate(showMessage) {
                this.$refs.syTable && this.$refs.syTable.validate(showMessage)
            },
            // 对指定列进行校验
            validateRows(rows) {
                this.$refs.syTable && this.$refs.syTable.validateRows(rows)
            },
            // 对部分表单字段进行校验
            validateField(props, showMessage) {
                this.$refs.syTable && this.$refs.syTable.resetFields(props, showMessage)
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
            async _requestData() {
                if (['object', 'function'].includes(isType(this.request))) {
                    if (!isType(this.$request, 'function')) {
                        return console.error('请在vue原型链中注入$request请求方法')
                    }
                    try {
                        let currentRow = this.tableProps.currentRow
                        this.loading_ = true
                        this.$emit('update:loading', true)
                        this.$emit('update:currentRow', null)
                        this.dataToRequest = []
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
                            this._getDataToResponse(data)
                        } else {
                            // 自定义函数，自定义函数返回值必须是Promise对象
                            let data = await limitedPromise(this.request(params))
                            this._getDataToResponse(data)
                        }
                        this.$emit('request-succeed', this.dataToRequest)
                        // 更新高亮行
                        if (currentRow) {
                            let rowKey = this.tableProps.rowKey
                            currentRow = this.dataToRequest.find(row => {
                                return row[rowKey] === currentRow[rowKey]
                            })
                        }
                        this.$emit('update:currentRow', currentRow || this.dataToRequest[0])
                    } catch (err) {
                        console.error(err)
                        this.$emit('request-error', err)
                    }
                    this.loading_ = false
                    this.$emit('update:loading', false)
                } else if (Array.isArray(this.data)) {
                    let dataList = this.data
                    let { filters = [], foldeds = [] } = this.filters_
                    filters = filters.concat(foldeds)
                    if (filters.length) {
                        dataList = filterList(
                            this.data,
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
                    this.dataToRequest = dataList.slice((this.pageIndex - 1) * this.pageSize, this.pageIndex * this.pageSize)
                }
            },
            // 更新分页参数
            _updatePageParam() {
                this.$set(this.params, 'pageSize', this.pageSize)
                this.$set(this.params, 'pageIndex', this.pageIndex)
                clearTimeout(this.requestTimer)
                this.requestTimer = setTimeout(this._requestData, 100)
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
                    this.dataToRequest = null
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
