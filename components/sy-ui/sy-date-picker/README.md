sy-date-picker
===========================
同 `el-date-picker` 保留原组件所有能力

### 新增组件参数

|参数名|说明|类型|可选值|默认值|
|---|---|---|---|---|
|bindProps|当type为范围选择器时，原 `el-date-picker` 组件更新value的值为Array类型，但通常传递和接受后端数据为两个字段，所以在发送请求前和获取数据后都得把两个字段的数据处理成数组；为了简化这个步骤，该组件使用`bindProps`接收一个数组，数组的每个项对应value的每个项需要赋值给bindObject的属性名，在value更新时，组件会自动更新bindProps设置的属性值|Array|-|-|
|bindObject|只有当设置bindProps后有效|Object|-|-|

[< 返回组件列表](https://github.com/i-yxs/sy-ui-pc/blob/main/README.md#组件列表)
