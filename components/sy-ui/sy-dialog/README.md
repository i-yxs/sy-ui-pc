sy-dialog
===========================
同 `el-dialog` 保留原组件所有props

### 新增组件参数

|参数名|说明|类型|可选值|默认值|
|---|---|---|---|---|
|height|对话框的高度|String|-|-|
|loading|内部loading|Boolean|-|-|
|loadingProps|loading配置，`text`、`spinner`、`background` 对于 v-loading 的 `element-loading-text`、`element-loading-spinner`、`element-loading-background`|Object|-|-|
|padding|内部边距大小|String|-|-|
|contentStyle|自定义内容元素样式|Object|-|-|
|beforeCloseAsking|关闭前询问是否关闭|Boolean|-|true|
|askingText|询问文本|String|-|确定放弃本次操作？|

### slot
|名称|说明|
|---|---|
|title|自定义标题|
|default|内容|
|footer|按钮操作区的内容|

[< 返回组件列表](https://github.com/i-yxs/sy-ui-pc/blob/main/README.md#组件列表)
