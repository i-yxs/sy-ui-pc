
import {
    isType,
    isEmpty
} from '../utils'
/**
 * 验证前提，配置表单项的值包含or不包含指定值时才验证该规则
 * premise数据格式 Object, Array[Object]
 * {
 *      // 验证的其他表单项prop
 *      prop: String,
 *      // 包含
 *      includes: Any/Array[Any],
 *      // 排除
 *      excludes: Any/Array[Any],
 *      // 指定表单项的值不为空才验证该规则
 *      required: Boolean
 * }
 */
export function validatePremise(rules, formData) {
    if (Array.isArray(rules)) {
        return rules.filter(rule => {
            let premises = isType(rule.premise, 'object') ? [rule.premise] : rule.premise
            if (Array.isArray(premises)) {
                if (premises.findIndex(premise => {
                    if (premise.required && isEmpty(formData[premise.prop])) {
                        return true
                    }
                    if ('includes' in premise) {
                        // 如果 includes 等于or包含指定表单项的值才验证该规则
                        let includes = Array.isArray(premise.includes) ? premise.includes : [premise.includes]
                        if (Array.isArray(includes)) {
                            return includes.indexOf(formData[premise.prop]) === -1
                        }
                    }
                    if ('excludes' in premise) {
                        // 如果 excludes 不等于or不包含指定表单项的值才验证该规则
                        let excludes = Array.isArray(premise.excludes) ? premise.excludes : [premise.excludes]
                        if (Array.isArray(excludes)) {
                            return excludes.indexOf(formData[premise.prop]) > -1
                        }
                    }
                }) > -1) return false
            }
            return true
        })
    }
    return []
}
