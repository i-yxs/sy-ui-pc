
import Vue from 'vue'
import {
    isType,
    isEmpty,
    getDictProp,
    moneyFormat,
    get2Function,
    differenceMerge,
    hyphenationToCamel
} from '../utils'
import createComponent from '../utils/createComponent'
import { validatePremise } from '../sy-form-config/utils'
import defaultProps from '../default-props'
import dateTools from '../utils/dateTools'

const emptyValue = '- -'

const renderComponent = function(h, params) {
    let { row, column } = params
    let value = row[column.prop]
    if (isType(get2Function(column.component), 'object')) {
        let { name, props, event } = column.component
        name = hyphenationToCamel(name, true)
        props = differenceMerge(props, defaultProps[name]) || {}
        return h(name, {
            ...props,
            props: {
                ...props,
                value
            },
            on: {
                ...event,
                input: (value) => {
                    Vue.set(row, column.prop, value)
                    get2Function(column.onInput, params)
                },
                click: ($event) => get2Function(column.onClick, $event),
                change: ($event) => get2Function(column.onChange, $event)
            }
        })
    } else {
        return isEmpty(value) ? value : emptyValue
    }
}
const renderCustomColumn = function(h, params) {
    let { row, column } = params
    let value = row[column.prop]
    let prefix = column.prefix || ''
    let suffix = column.suffix || ''
    // 自定义类型
    if (['text', 'dateRange', 'component'].indexOf(column.type) === -1 && isEmpty(value)) {
        return emptyValue
    } else {
        switch (get2Function(column.type, params)) {
        // 自定义文本
        case 'text':
            return column.prop
        // 字典
        case 'dict':
            return prefix + getDictProp(value, column.dict, 'label', {
                valueKey: isEmpty(column.valueKey) ? 'value' : column.valueKey
            }) + suffix
        // 状态
        case 'status':
            return <ColumnStatus row={row} column={column} />
        // 日期
        case 'date':
            return prefix + dateTools.format(value, column.format || 'YYYY-MM-DD') + suffix
        // 日期范围
        case 'dateRange':
            if (column.startDateKey && column.endDateKey) {
                let startDate = row[column.startDateKey]
                let endDate = row[column.endDateKey]
                if (!isEmpty(startDate) && !isEmpty(endDate)) {
                    return prefix + `${dateTools.format(startDate, column.format || 'YYYY-MM-DD')} ${column.separator | '至'} ${dateTools.format(endDate, column.format || 'yyyy-MM-DD')}` + suffix
                }
            }
            return emptyValue
        // 金额
        case 'money':
            return prefix + moneyFormat(value, column.precision) + suffix
        // 组件
        case 'component':
            return renderComponent(h, params)
        default:
            return prefix + value + suffix
        }
    }
}
const renderType = function(h, params) {
    let { row, column } = params
    if (get2Function(column.isRender, params) !== false && isType(column.render, 'function')) {
        // jsx语法渲染
        return column.render(params)
    }
    if (isType(column.formatter, 'function')) {
        // 自定义处理方法
        return column.formatter(params)
    }
    if (get2Function(column.isClick, params)) {
        // 表格列可点击
        return (
            <span
                class='link'
                style={get2Function(column.style, params)}
                onClick={(e) => {
                    e.stopPropagation()
                    let clickType = get2Function(column.clickType, params)
                    if (clickType) {
                        createComponent({
                            component: clickType,
                            attribute: {
                                props: {
                                    dataId: row[column.idKey || 'id'],
                                    ...get2Function(column.clickProps, params)
                                }
                            }
                        })
                    }
                    if (isType(column.onClick, 'function')) {
                        e.stopPropagation()
                        column.onClick(params)
                    }
                }}
            >
                { renderCustomColumn(h, params)}
            </span>
        )
    }
    return renderCustomColumn(h, params)
}
// 自定义表格渲染
export default {
    name: 'ColumnItem',
    functional: true,
    render(h, context) {
        let props = context.props || {}
        let { column, index } = props
        return (
            <el-table-column
                prop={column.prop}
                label={column.label}
                width={column.width}
                fixed={column.fixed}
                align={column.align}
                min-width={column.minWidth}
                sortable={column.sortable}
                showOverflowTooltip={column.showOverflowTooltip || true}
                scopedSlots={{
                    default: scope => {
                        let params = { row: scope.row, column, index }
                        if (Array.isArray(column.children)) {
                            // 多级表头
                            return column.children.filter(context.parent._getColumnVisible).map((column, index) => {
                                return (
                                    <column-Item
                                        index={index}
                                        column={column}
                                    />
                                )
                            })
                        }
                        return (
                            <div class='cell-col'>
                                <el-form-item
                                    prop={'row.' + scope.$index + '.' + column.prop}
                                    rules={validatePremise(column.rules, scope.row)}
                                >
                                    {renderType(h, params)}
                                </el-form-item>
                            </div>
                        )
                    }
                }}
                props={column.props}
            />
        )
    }
}
