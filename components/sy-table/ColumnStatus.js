
/**
 * 表格列状态
 * dot      前面带颜色圆点样式
 * block    带颜色背景的块状样式
 */
import {
    isEmpty,
    getDictProp
} from '../utils'
export default {
    functional: true,
    props: {
        row: Object,
        column: Object
    },
    render: (h, context) => {
        let { row, column } = context.props
        let style = column.style || 'dot'
        let value = row[column.prop]
        let data = getDictProp(value, column.dict, null, {
            valueKey: isEmpty(column.valueKey) ? 'value' : column.valueKey
        })
        if (data) {
            switch (style) {
            case 'dot':
                return (
                    <div class='column-status dot'>
                        <i style={{ background: data.color }} class='dot'/>
                        <span class='label'>{ data.label }</span>
                    </div>
                )
            case 'block':
                return (
                    <div class='column-status block' style={{ background: data.color }}>{ data.label }</div>
                )
            }
        }
        return <span>- -</span>
    }
}
