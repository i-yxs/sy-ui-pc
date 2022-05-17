<!--
* @description 百度地图封装
* @author yc
!-->
<template>
    <baidu-map
        class="sy-baidu-map"
        v-bind="mapProps"
        @click="handleClick"
        @ready="handleReady"
    >
        <slot />
        <sy-baidu-marker
            v-for="(marker, index) in drawObject.markers"
            :key="index"
            v-bind="marker"
        >
            <slot name="marker" />
        </sy-baidu-marker>
        <sy-baidu-search />
    </baidu-map>
</template>
<script>
    // 方法
    import {
        attrsToProps,
        differenceMerge,
        hyphenationToCamel
    } from '../utils'
    import defaultProps, { setPropsDefault } from '../default-props'
    // 组件
    const NAME = 'sy-baidu-map'
    const booleanKeys = [
        'mapClick',
        'dragging',
        'scrollWheelZoom',
        'doubleClickZoom',
        'keyboard',
        'inertialDragging',
        'continuousZoom',
        'pinchToZoom',
        'autoResize',
        'highResolution'
    ]

    export default {
        name: hyphenationToCamel(NAME),
        inheritAttrs: false,
        props: setPropsDefault({
            // 地图光标
            cursor: { type: String, default: 'default' },
            // 标记点
            markers: Array,
            // 折线
            polyline: Array,
            // 多边形
            polygons: Array,
            // 是否只读
            readonly: Boolean,
            // 是否可以标多个点，enableMarkerPoint = true 时有效
            multiple: Boolean,
            // 是否启用标点功能
            enableMarkerPoint: Boolean,
            // 是否启用绘线功能
            enableDrawPolyline: Boolean,
            // 是否启用绘面功能
            enableDrawPolygons: Boolean
        }, NAME),
        data() {
            return {
                ready: false,
                drawObject: {
                    markers: [],
                    polyline: [],
                    polygons: []
                }
            }
        },
        provide() {
            return {
                provideComponent: this
            }
        },
        computed: {
            mapProps() {
                let props = differenceMerge(attrsToProps(this.$attrs, booleanKeys), defaultProps[NAME])
                return props
            }
        },
        watch: {
            cursor() {
                if (this.map) {
                    this.map.setDefaultCursor(this.cursor)
                }
            },
            markers: {
                immediate: true,
                handler(markers = []) {
                    this.drawObject.markers = [...markers]
                }
            },
            polyline: {
                immediate: true,
                handler(polyline = []) {
                    this.drawObject.polyline = [...polyline]
                }
            },
            polygons: {
                immediate: true,
                handler(polygons = []) {
                    this.drawObject.polygons = [...polygons]
                }
            }
        },
        methods: {
            // 获取中文地理位置
            geocoder(point) {
                new BMap.Geocoder().getLocation(
                    new BMap.Point(point.longitude, point.latitude),
                    data => {
                        if (data.addressComponents) {
                            let { province, city, district, street, streetNumber } = data.addressComponents
                            point.address = `${province || ''}${city || ''}${district || ''}${street || ''}${streetNumber || ''}`
                        }
                    }
                )
            },
            // 创建标记点
            addMarker(point) {
                this.geocoder(point)
                if (this.enableMarkerPoint) {
                    if (this.multiple) {
                        this.drawObject.markers.push(point)
                    } else {
                        this.drawObject.markers = []
                        this.$nextTick(() => {
                            this.drawObject.markers = [point]
                        })
                    }
                }
                this.$emit('update:markers', this.drawObject.markers)
            },
            // 地图准备就绪时触发
            handleReady($event) {
                let { map, BMap } = $event
                this.map = map
                this.BMap = BMap
                this.ready = true
                map.addControl(new BMap.MapTypeControl({ anchor: BMAP_ANCHOR_BOTTOM_RIGHT }))
                map.setDefaultCursor(this.cursor)
                this.$emit('ready', $event)
            },
            // 点击地图时触发
            handleClick($event) {
                if (this.readonly) return
                let { lng, lat } = $event.point
                this.addMarker({ latitude: lat, longitude: lng })
            }
        }
    }
</script>

<style lang='scss' scoped>
.sy-baidu-map {
    position: relative;
    height: 100%;
}
</style>
