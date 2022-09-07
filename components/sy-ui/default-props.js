import { Message } from 'element-ui'
import { checkPermissions } from '@/directive/permission'
import { isType, hyphenationToCamel } from './utils'
import { getToken, getRefreshToken } from '@/utils/auth'
import {
    BASE_API,
    baseDownSrc,
    uploadFileUrl
} from '@/utils'

const datePicker = {
    style: {
        width: '100%'
    },
    type: 'date',
    format: 'yyyy-MM-dd',
    editable: false,
    valueFormat: 'yyyy-MM-dd HH:mm:ss',
    rangeSeparator: '至',
    placeholder: '请选择',
    startPlaceholder: '开始日期',
    endPlaceholder: '结束日期'
}
const timePicker = {
    style: {
        width: '100%'
    },
    format: 'HH:mm:ss',
    editable: false,
    valueFormat: 'HH:mm:ss',
    rangeSeparator: '~',
    placeholder: '请选择',
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间'
}

const cascader = {
    style: {
        width: '100%'
    },
    props: {
        emitPath: false,
        checkStrictly: true
    },
    filterable: true,
    showAllLevels: true
}

const upload = {
    drag: true,
    limit: 50,
    maxSize: 30,
    action: uploadFileUrl,
    thumbApi: baseDownSrc,
    originalApi: baseDownSrc,
    formatResponse(response) {
        return response.data
    },
    headers() {
        return {
            token: getToken(),
            refreshToken: getRefreshToken()
        }
    }
}

const defaultProps = {
    'sy-table': {
        checkAccessMethod: checkPermissions
    },
    'sy-dropdown': {
        checkAccessMethod: checkPermissions
    },
    'sy-layout-filter': {
        checkAccessMethod: checkPermissions
    },
    'el-date-picker': datePicker,
    'sy-date-picker': datePicker,
    'el-time-picker': timePicker,
    'sy-time-picker': timePicker,
    'el-input-number': {
        style: {
            width: '100%'
        },
        controlsPosition: 'right'
    },
    'el-cascader': cascader,
    'sy-select': {
        style: {
            width: '100%'
        },
        filterable: true
    },
    'sy-switch': {
        activeText: '是',
        activeValue: true,
        inactiveText: '否',
        inactiveValue: false
    },
    'sy-cascader': cascader,
    'sy-upload': {
        ...upload,
        multiple: true,
        acceptType: '.jpg, .jpeg, .png, .pdf, .docx, .doc, .wps, .xlsx, .xml, .mp4, .ogg, .webm'
    },
    'sy-upload-card': {
        ...upload,
        acceptType: '.jpg, .jpeg, .png',
        cardStyle: {
            width: '90px',
            height: '84px'
        }
    },
    'sy-baidu-map': {
        zoom: 12,
        center: '',
        fullscreen: true,
        scrollWheelZoom: true
    },
    'sy-picker-location': {
        bindProps: {
            latitude: 'geoY',
            longitude: 'geoX'
        }
    },
    'sy-picker-location-dialog': {
        fullscreen: true,
        beforeConfirm({ markers }) {
            if (markers.length === 0) {
                Message.warning('请至少选择一个地点')
                return false
            }
        },
        enableMarkerPoint: true
    },
    'sy-import-button': {
        baseUrl: BASE_API,
        headers() {
            return {
                token: getToken(),
                refreshToken: getRefreshToken()
            }
        },
        downloadBaseUrl: baseDownSrc
    }
}

// 设置props的默认值
export function setPropsDefault(props, name) {
    name = hyphenationToCamel(name, true)
    if (name in defaultProps) {
        let props_ = {}
        Object.keys(props).forEach(key => {
            if (key in defaultProps[name]) {
                switch (isType(props[key])) {
                    case 'function':
                        props_[key] = { type: props[key], default: defaultProps[name][key] }
                        break
                    case 'object':
                        if ('default' in props) {
                            props_[key] = props[key]
                        } else {
                            props_[key] = {
                                ...props[key],
                                default: defaultProps[name][key]
                            }
                        }
                        break
                    default:
                        props_[key] = { default: defaultProps[name][key] }
                        break
                }
            } else {
                props_[key] = props[key]
            }
        })
        return props_
    }
    return props
}

export default defaultProps
