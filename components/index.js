
import './index.scss'

export default {
    install(Vue) {
        let context = require.context('./', true, /\.vue$/)
        context.keys().forEach(key => {
            let component = context(key)
            if (component.default) {
                component = component.default
            }
            Vue.component(component.name, component)
        })
    }
}
