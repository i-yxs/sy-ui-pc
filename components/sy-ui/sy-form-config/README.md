sy-form-config
===========================
动态表单配置组件，相比于传统表单开发方式，有着可维护性高、提高开发效率的优点

### 组件参数

|参数名|说明|类型|可选值|默认值|
|---|---|---|---|---|
|formData|表单数据|Object|-|-|
|formItem|表单项配置|Array|-|-|
|formRule|表单验证规则|Object|-|-|
|size|同`el-form`的`size`|String|-|-|
|disabled|同`el-form`的`disabled`|Boolean|-|-|
|labelWidth|同`el-form`的`labelWidth`|String|-|-|
|span|控制该表单内每个项占据的列数|Number|-|12|

### formItem

```js
[
    {
        // 同 el-form-item 的 prop
        prop: String,
        // 用于控制该项占据的列数，优先级大于组件的span
        span: Number,
        // 组件类型名称，可以为全局引入的所有组件
        type: String,
        // 组件的props
        props: Object,
        // 组件的插槽
        slots: Array,
        // 绑定事件
        `on + 事件名称（首字母大写）`: Function,
        // 自定义渲染器，设置时type无效；用法参考 formItem.render
        render: Function,
        // 前置渲染器；用法参考 formItem.render
        prependRender: Function,
        // 后置渲染器；用法参考 formItem.render
        appendRender: Function
    }
]
```

### formItem.slots
> 插槽

```js
{
    slots: [
        {
            // 插槽名称
            name: String,
            // 插槽渲染器；用法参考 formItem.render
            render: Function,
        }
    ]
}
```

### formItem.render
> 渲染函数

```js
{
    render: ({h, item}) => {
        // 返回值为jsx
        return jsx
    }
}
```

[< 返回组件列表](https://github.com/i-yxs/sy-ui-pc/blob/main/README.md#组件列表)
