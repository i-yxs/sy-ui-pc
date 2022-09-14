sy-checkbox
===========================
同 `el-checkbox-group` 保留原组件所有props
<br>
该组件使用配置项来生成 `el-checkbox` 和 `el-checkbox-button`

### 组件参数

|参数名|说明|类型|可选值|默认值|
|---|---|---|---|---|
|button|是否按钮样式，默认渲染 `el-checkbox` ，当为true时则渲染 `el-checkbox-button` |Boolean|-|-|
|options|数据源|Array, String|-|-|
|labelKey|从options内获取的label属性名称|String|-|label|
|valueKey|从options内获取的value属性名称|String|-|value|

### options

> options的可选配置项为 el-checkbox、el-checkbox-button 组件的props<br>
> 以下为特殊配置项：

```js
[
  {
    [labelKey]: String,
    [valueKey]: Any,
  },
  ...
]
```
