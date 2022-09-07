<!--
* @description 地图搜索
* @author yc
!-->
<template>

    <div class="sy-baidu-search">
        <div class="search-input">
            <el-input
                v-model="keyword"
                :style="{width: width + 'px'}"
                clearable
                placeholder="输入关键词搜索"
                @blur="handleBlur"
                @clear="handleInput"
                @focus="handleFocus"
                @input="handleInput"
            />
        </div>
        <el-popover
            v-model="popoverVisible"
            placement="bottom-end"
            :width="width"
            trigger="manual"
            transition="el-zoom-in-top"
            popper-class="sy-layout-popover"
        >
            <div class="result-popover-content">
                <template v-if="options.length">
                    <div
                        class="option"
                        v-for="option in options"
                        :key="option.value"
                        @click="handleOptionClick(option)"
                    >
                        <p class="title sy-ui-ellipsis l2">{{ option.title }}</p>
                        <p class="address sy-ui-ellipsis l2">{{ option.address }}</p>
                    </div>
                </template>
                <sy-empty
                    v-else
                    v-bind="emptyProps"
                    style="height: auto"
                />
            </div>
            <div slot="reference" />
        </el-popover>
    </div>
</template>
<script>
    // 方法
    import {
        hyphenationToCamel
    } from '../utils'
    // 组件
    const NAME = 'sy-baidu-search'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: {
            width: { type: [String, Number], default: 260 }
        },
        data() {
            return {
                options: [],
                keyword: '',
                loading: false,
                popoverVisible: false
            }
        },
        inject: ['provideInstance'],
        computed: {
            emptyProps() {
                if (this.loading) {
                    return {
                        text: '加载中',
                        icon: 'el-icon-loading',
                        iconSize: '20px'
                    }
                }
                if (this.keyword) {
                    return {
                        text: '未找到结果'
                    }
                }
                return {
                    text: '请输入关键词搜索',
                    icon: 'el-icon-search',
                    iconSize: '40px'
                }
            }
        },
        watch: {
            'provideInstance.ready'() {
                this.init()
            }
        },
        mounted() {
            this.init()
        },
        methods: {
            // 初始化
            init() {
                if (this.provideInstance.ready) {
                    this.localSearch = new BMap.LocalSearch(this.provideInstance.map, {
                        pageCapacity: 20,
                        onSearchComplete: (res) => {
                            this.options = res.Cr || res.Br || []
                            this.loading = false
                        }
                    })
                }
            },
            handleBlur() {
                if (!this.keyword) {
                    this.popoverVisible = false
                }
            },
            handleFocus() {
                this.popoverVisible = true
            },
            handleInput() {
                if (this.localSearch) {
                    clearTimeout(this.timer)
                    if (this.keyword) {
                        this.loading = true
                        this.timer = setTimeout(() => {
                            this.options = []
                            this.localSearch.search(this.keyword, {
                                forceLocal: false
                            })
                        }, 300)
                    } else {
                        this.options = []
                    }
                }
            },
            handleOptionClick(option) {
                let { lng, lat } = option.point
                this.$emit('change', {
                    label: option.title,
                    latitude: lat,
                    longitude: lng
                })
                this.popoverVisible = false
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-baidu-search {
    position: absolute;
    left: 10px;
    top: 10px;
}
.result-popover {
    padding: 0;
}
.result-popover-content {
    max-height: 400px;
    overflow: auto;
    .option {
        padding: 10px;
        cursor: pointer;
        & + .option {
            border-top: solid 1px #f3f3f3;
        }
        &:hover {
            background: #f9f9f9;
        }
        .title {
            color: #333;
        }
        .address {
            color: #999;
        }
    }
    .sy-empty {
        margin: 10px 0;
    }
}
</style>
