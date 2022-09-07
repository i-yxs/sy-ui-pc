
import Vue from 'vue'
import {
    isType,
    isEmpty,
    getDictProp,
    get2Function,
    toLocaleString,
    differenceMerge,
    getComponentProps,
    hyphenationToCamel
} from '../utils'
import createComponent from '../utils/createComponent'
import { validatePremise } from '../sy-form-config/utils'
import defaultProps from '../default-props'
import dateTools from '../utils/dateTools'

const emptyValue = '- -'
const renderComponent = function (h, params) {
    let { row, column } = params
    let value = row[column.prop]
    let component = get2Function(column.component, params)
    if (isType(component, 'object')) {
        let {
            name,
            props,
            attribute = {}
        } = component
        let attrs = {}
        let tagProps = getComponentProps(this.parent, name)
        props = differenceMerge({}, get2Function(props, params), defaultProps[name])
        props.value = value
        props.bindObject = row
        Object.keys(props).forEach(key => {
            if (!(key in tagProps)) {
                attrs[key] = props[key]
            }
        })
        name = hyphenationToCamel(name, true)
        return h(name, {
            ...attribute,
            on: {
                ...attribute.on,
                input: ($event) => {
                    Vue.set(row, column.prop, $event)
                    get2Function(column.onInput, params, $event)
                },
                click: ($event) => get2Function(column.onClick, params, $event),
                change: ($event) => get2Function(column.onChange, params, $event)
            },
            style: attrs.style,
            class: attrs.class,
            attrs: {
                ...attribute.attrs,
                ...attrs
            },
            props: {
                ...attribute.props,
                ...props
            }
        })
    } else {
        return isEmpty(value) ? value : emptyValue
    }
}
const renderCustomColumn = function (h, params) {
    let { row, column } = params
    let type = get2Function(column.type, params)
    let value = row[column.prop]
    let prefix = get2Function(column.prefix, params) || ''
    let suffix = get2Function(column.suffix, params) || ''
    // 自定义类型
    if (['text', 'index', 'dateRange', 'component'].indexOf(type) === -1 && isEmpty(value)) {
        return emptyValue
    } else {
        switch (type) {
            // 自定义文本
            case 'text':
                return column.prop
            // 字典
            case 'dict':
                return prefix + getDictProp(value, column.dict, 'label', {
                    valueKey: isEmpty(column.valueKey) ? 'value' : column.valueKey
                }) + suffix
            // 下标
            case 'index':
                return this.parent._getIndex(params.index)
            // 状态
            case 'status':
                return <sy-column-status row={row} column={column} />
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
            // 数值
            case 'number':
                return prefix + toLocaleString(value, 0, column.precision) + suffix
            // 组件
            case 'component':
                return renderComponent.call(this, h, params)
            default:
                return prefix + value + suffix
        }
    }
}
const renderType = function (h, params) {
    let { row, column } = params
    let value = ''
    if (get2Function(column.isRender, params) !== false && isType(column.render, 'function')) {
        // jsx语法渲染
        value = column.render(params)
    } else if (isType(column.formatter, 'function')) {
        // 自定义处理方法
        value = column.formatter(params)
    } else {
        value = renderCustomColumn.call(this, h, params)
    }
    if (value !== emptyValue) {
        if (get2Function(column.isClick, params)) {
            // 表格列可点击
            value = (
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
                >{value}</span>
            )
        }
    }
    return value
}
const renderColumn = function (h, column) {
    let childrenNode = []
    if (Array.isArray(column.children)) {
        // 多级表头
        childrenNode = column.children.filter(this.parent._getColumnVisible).map(column => {
            return renderColumn.call(this, h, column)
        })
    }
    return (
        <el-table-column
            prop={column.prop}
            fixed={this.parent._getColumnFixed(column)}
            label={column.label}
            align={column.align}
            width={this.parent._getRealWidth(column.width)}
            minWidth={this.parent._getRealWidth(column.minWidth)}
            sortable={column.sortable}
            showOverflowTooltip={isEmpty(column.showOverflowTooltip) ? true : column.showOverflowTooltip}
            scopedSlots={{
                default: scope => {
                    let params = { row: scope.row, column, index: scope.$index }
                    return (
                        <div class='cell-col'>
                            <el-form-item
                                prop={'rows.' + scope.$index + '.' + column.prop}
                                rules={validatePremise(column.rules, params.row)}
                            >
                                {renderType.call(this, h, params)}
                            </el-form-item>
                        </div>
                    )
                }
            }}
            props={column.props}
        >{childrenNode}</el-table-column>
    )
}
// 自定义表格渲染
export default {
    name: 'SyColumnItem',
    functional: true,
    render(h, context) {
        let props = context.props || {}
        return renderColumn.call(context, h, props.column)
    }
}
