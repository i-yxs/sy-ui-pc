<template>
    <div class="sy-bmgl-overlay">
        <slot />
    </div>
</template>

<script>
    // API
    // 方法
    // 组件

    export default {
        name: 'SyBmglOverlay',
        props: {
            lng: [String, Number],
            lat: [String, Number],
            pane: { type: String, default: 'markerPane' },
            draw: Function
        },
        inject: ['bmgl'],
        watch: {
            lng: 'redraw',
            lat: 'redraw',
            draw: 'redraw',
            pane: 'reload'
        },
        mounted() {
            if (this.bmgl) {
                if (this.bmgl.ready) {
                    this.init()
                } else {
                    this.bmgl.$on('ready', this.init)
                }
            } else {
                console.warn('请在sy-baidu-map-webgl组件插槽内部使用')
            }
        },
        beforeDestroy() {
            this.destroy()
        },
        methods: {
            // 初始化
            init() {
                let that = this
                let { map, BMapGL } = this.bmgl
                this.map = map
                this.BMapGL = BMapGL
                class Overlay extends BMapGL.Overlay {
                    initialize () {
                        try {
                            map.getPanes()[that.pane].appendChild(that.$el)
                        } catch (e) {}
                        return that.$el
                    }
                    draw () {
                        that.redraw()
                    }
                }
                this.instance = new Overlay()
                map.addOverlay(this.instance)
            },
            // 重绘
            redraw() {
                if (typeof this.draw === 'function') {
                    this.draw({
                        map: this.map,
                        BMapGL: this.BMapGL,
                        el: this.$el,
                        ref: this,
                        overlay: this.instance
                    })
                } else {
                    let { lng, lat } = this
                    let pixel = this.map.pointToOverlayPixel(new BMapGL.Point(lng, lat))
                    this.$el.style.left = pixel.x + 'px'
                    this.$el.style.top = pixel.y + 'px'
                }
            },
            // 重载
            reload() {
                this.destroy()
                this.init()
            },
            // 销毁
            destroy() {
                this.map.removeOverlay(this.instance)
            }
        }
    }
</script>

<style lang="scss" scoped>
.sy-bmgl-overlay {
    position: absolute;
}
</style>
