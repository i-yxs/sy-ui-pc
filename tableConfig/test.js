
export default {
    get() {
        return {
            columns: [
                { label: '车牌号', prop: 'no', minWidth: 110, isClick: true, clickType: 'car', idKey: 'carId' },
                { label: 'GPS设备号', prop: 'deviceCode', minWidth: 120 },
                { label: '车辆类型', prop: 'carTypeName', width: 120 },
                { label: '品牌型号', prop: 'carBrand', width: 120 },
                { label: '核载（吨）', prop: 'vehicleLoad', width: 120 },
                { label: '权属类型', prop: 'ownerType', width: 120, type: 'dict', dict: 'MES.DEVICE.OWNER_TYPE' },
                { label: '能耗类型', prop: 'powerTypeName', width: 120 },
                { label: '状态', prop: 'status', width: 120, type: 'status', dict: 'carStatusEnum', style: 'block', align: 'center' }
            ],
            filters: {
                filters: [
                    {
                        prop: 'carNo',
                        label: '车牌号',
                        type: 'el-input'
                    },
                    {
                        prop: 'carType',
                        label: '车辆类型',
                        type: 'sy-cascader',
                        props: {
                            options: 'carType'
                        }
                    },
                    {
                        prop: 'deptId',
                        label: '所属部门',
                        type: 'sy-cascader',
                        props: {
                            options: 'deptTree'
                        }
                    }
                ],
                foldeds: [
                ]
            },
            request: {
                url: '/car/listPage',
                method: 'GET'
            },
            rowKey: 'carId'
        }
    }
}
