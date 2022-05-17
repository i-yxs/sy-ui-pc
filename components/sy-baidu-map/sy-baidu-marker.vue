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
            latitude: [String, Number],
            longitude: [String, Number]
        },
        computed: {
            position() {
                return {
                    lat: this.latitude,
                    lng: this.longitude
                }
            }
        },
        methods: {
            handleDraw({ el, BMap, map }) {
                let pixel = map.pointToOverlayPixel(new BMap.Point(this.longitude, this.latitude))
                el.style.left = pixel.x + 'px'
                el.style.top = pixel.y + 'px'
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-baidu-marker {
    position: absolute;
}
</style>
