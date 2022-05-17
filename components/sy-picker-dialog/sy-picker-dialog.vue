<!--
* @description 窗口选择器
* @author yc
!-->
<template>
    <sy-dialog
        :title="title"
        :width="width"
        :visible="visible"
        :beforeCloseAsking="false"
        :closeOnClickModal="false"
        @update:visible="$emit('update:visible', false)"
    >
        <div class="sy-picker-dialog">
            <el-tabs
                v-if="tabsProps"
                v-model="tabsValue_"
                class="layout-tabs not-margin"
            >
                <el-tab-pane
                    v-for="item in tabsProps"
                    :key="item.name"
                    :name="item.name"
                    :label="item.label"
                />
            </el-tabs>
            <sy-table-config
                ref="syTableConfig"
                v-bind="tableProps_"
                :params="params"
                :selected-rows.sync="selectedRows"
                @update:selectedRows="handleSelectionChange"
            />
        </div>
        <span v-if="tableProps_.selectable" slot="footer">
            <el-button size="mini" @click="$emit('update:visible', false)">取 消</el-button>
            <el-button type="primary" size="mini" @click="handleConfirm">确 定</el-button>
        </span>
    </sy-dialog>
</template>
<script>
    // 方法
    import config from './config'
    import {
        isType,
        isEmpty,
        deepMerge,
        hyphenationToCamel
    } from '../utils'
    import { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-picker-dialog'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 选中项
            value: Array,
            // 窗口标题
            title: String,
            // 窗口宽度
            width: { type: String, default: '1200px' },
            // 窗口可见状态
            visible: Boolean,
            // 最大可选数量
            maxCount: Number,
            /**
             * 后端接口获取的原始数据，用于跟value对比合并
             * 如果要实现在表格选中上次选中的数据，需要把选中的列表数据通过value传递过来，然后组件通过rowKey来判断某条数据是否被选中；
             * 在数据还没有提交到后端时，这样做没有问题；
             * 但如果已经提交到后端，然后通过接口获取后，通常数据的属性名已经被重新命名，前端很难再拿到选择前的原始数据；
             * 所以通常我们需要重新转换数据，重新为每条数据转换成只包含rowKey的对象;
             * 但如果数据比较多，出现分页时，在没有翻到上次选中的数据页码时，组件也拿不到原始数据，所以用户点击确认后，返回的也是只包含rowKey的对象；
             * 这时需要把从接口获取的原始数据赋值给valueToData，组件内部会自动比对合并成，需要配合onTransform钩子函数转换成提交到后端的数据结构
             */
            valueToData: Array,
            // 用于转换数据的钩子函数
            onTransform: Function,
            // 是否多选
            multiple: Boolean,
            /**
             * 选项卡配置
             * 数据结构：
             * [
             *      {
             *          type: any, // 选项卡的类型
             *          label: String, // 选项卡名称
             *          tableProps: [Object, String, Array] // 同组件的tableProps
             *      }
             * ]
             */
            tabsProps: Array,
            // 选项卡的值
            tabsValue: null,
            /**
             * 表格配置，不同的数据类型有不同的处理逻辑
             * 当类型为对象时，则直接传递给sy-table-config组件
             * 当类型为数组时，每项分别为配置类型名称（String）、用于合并的对象（Object）、上下文（可选）
             * 当类型为字符串时，会根据该字符串读取公共配置文件的表格配置数据
             */
            tableProps: [Object, String, Array]
        }, NAME),
        data() {
            return {
                params: {},
                tabsValue_: null,
                selectedRows: []
            }
        },
        computed: {
            tabsIndex() {
                let tabsValue_ = this.tabsValue_
                if (Array.isArray(this.tabsProps)) {
                    return this.tabsProps.findIndex(item => item.name === tabsValue_)
                }
                return -1
            },
            tableProps_() {
                let multiple = this.multiple
                let tableProps = this.tableProps
                if (Array.isArray(this.tabsProps) && this.tabsIndex > -1) {
                    let tabsProps = this.tabsProps[this.tabsIndex]
                    if ('multiple' in tabsProps) {
                        multiple = tabsProps.multiple
                    }
                    tableProps = tabsProps.tableProps
                }
                switch (isType(tableProps)) {
                case 'string':
                    try {
                        tableProps = config[tableProps].get.call(this)
                    } catch (err) {
                        console.log(`“${tableProps}”类型不存在`, err)
                    }
                    break
                case 'array':
                    try {
                        let [path, props = {}, context = this] = tableProps
                        tableProps = deepMerge(config[path].get.call(context), props)
                    } catch (err) {
                        console.log(`“${tableProps[0]}”类型不存在`, err)
                    }
                    break
                }
                return {
                    height: '608px',
                    ...tableProps,
                    multiple,
                    selectable: true
                }
            }
        },
        watch: {
            visible(visible) {
                if (visible) {
                    this.init()
                }
            },
            tabsValue_() {
                this.selectedRows = []
            },
            'tableProps.params': {
                deep: true,
                handler() {
                    this.init()
                }
            }
        },
        mounted() {
            this.init()
        },
        methods: {
            // 初始化组件
            init() {
                if (Array.isArray(this.tabsProps)) {
                    this.tabsValue_ = this.tabsValue
                    if (this.tabsIndex === -1) {
                        this.tabsValue_ = this.tabsProps[0].name
                    }
                }
                this.params = deepMerge({}, this.tableProps_.params)
                this.selectedRows = Array.isArray(this.value) ? this.value : []
                if (this.$refs.syTableConfig) {
                    this.$refs.syTableConfig.rerequestData()
                }
            },
            // 点击确定按钮时触发
            handleConfirm() {
                let {
                    value,
                    tabsValue_,
                    valueToData,
                    onTransform,
                    selectedRows
                } = this
                if (selectedRows.length) {
                    let rows = selectedRows
                    this.$emit('update:visible', false)
                    this.$emit('update:tabsValue', tabsValue_)
                    rows = rows.filter(row => !value.includes(row))
                    if (typeof onTransform === 'function') {
                        rows = rows.map(onTransform)
                    }
                    if (Array.isArray(valueToData)) {
                        rows = rows.concat(valueToData.filter((_, index) => selectedRows.includes(value[index])))
                    }
                    this.$emit('input', rows)
                    this.$emit('change', rows)
                } else {
                    this.$message.warning('请至少选中一项')
                }
            },
            // 选择项改变时触发
            handleSelectionChange(selectedRows) {
                if (this.tableProps_.multiple) {
                    let length = selectedRows.length
                    if (isType(this.maxCount, 'number') && length > this.maxCount) {
                        this.selectedRows = selectedRows.slice(0, this.maxCount)
                        this.$message.warning(`最大可选择数量"${this.maxCount}"，已选择"${length}"`)
                    }
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-picker-dialog {
    padding: 10px;
    .layout-tabs {
        margin-top: -10px;
        margin-bottom: 10px;
    }
}
::v-deep {
    .el-input__validateIcon {
        display: none;
    }
}
</style>
