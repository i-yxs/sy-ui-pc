<!--
* @description 标记点
* @author yc
!-->
<template>
    <bm-overlay
        pane="labelPane"
        class="sy-baidu-marker"
        @draw="handleDraw"
    >
        <slot>
            <div class="marker-label" v-if="label" @click.stop>
                <span class="label sy-ui-ellipsis l1" :title="label">{{ label }}</span>
                <i
                    v-if="loading"
                    class="icon el-icon-loading"
                    title="获取中"
                />
                <i
                    v-else
                    class="icon el-icon-place"
                    title="尝试获取边界"
                    @click.stop="handleBoundary"
                />
            </div>
            <bm-marker
                :position="position"
            />
        </slot>
    </bm-overlay>
</template>
<script>
    // 方法
    import {
        hyphenationToCamel
    } from '../utils'
    // 组件
    const NAME = 'sy-baidu-marker'

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: {
            label: String,
            latitude: [String, Number],
            longitude: [String, Number]
        },
        data() {
            return {
                loading: false
            }
        },
        computed: {
            position() {
                return {
                    lat: this.latitude,
                    lng: this.longitude
                }
            }
        },
        mounted() {
            this.boundary = new BMap.Boundary()
        },
        methods: {
            handleDraw({ el, BMap, map }) {
                let pixel = map.pointToOverlayPixel(new BMap.Point(this.longitude, this.latitude))
                el.style.left = pixel.x + 'px'
                el.style.top = pixel.y + 'px'
            },
            handleBoundary() {
                if (this.boundary) {
                    // this.loading = true
                    this.$message.warning('该功能正在开发中...')
                    // this.boundary.get(this.label, (res) => {
                    //     console.log(res)
                    //     this.loading = false
                    // })
                }
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-baidu-marker {
    position: absolute;
    .marker-label {
        position: absolute;
        left: -80px;
        top: -70px;
        display: flex;
        align-items: center;
        width: 160px;
        height: 40px;
        background: #fff;
        border-radius: 2px;
        box-shadow: 0 1px 6px rgba(0,0,0,.2);
        cursor: default;
        .label {
            flex: 1;
            color: #666;
            text-align: center;
            padding-left: 10px;
        }
        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            color: #666;
            cursor: pointer;
            &:hover {
                color: #409EFF;
            }
        }
    }
}
</style>
