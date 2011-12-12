
(function( $, undefined ){
    var tm_timemachine = null;
    var tm_canvas = null;
    var tm_ctx = null;
    var tm_center = {};
    var tm_drag = new Object();
    var tm_current = 0;
    var tm_drag_area = {};
    var tm_showOverlay = false;
    var tm_self;

    $.extend( 
        $.widget( "ui.timemachine", {
            options: {
                clockpicker_height: 200,
                clockpicker_width: 200,
                context: null,
            },

            _init: function() {
                var timemachine = this.element;
                timemachine.append('<div id="clockpicker"></div>'+
                                   /*'<div id="datepicker"></div>'+*/
                                   '<div id="digitime"></div>');
            },

            _create: function() {
                tm_self = this;
                this._init();
                this._render_datepicker(this, tm_timemachine);
                this._render_clockpicker(this, tm_timemachine);
                this._render_digitime(this, tm_timemachine);
            },

            _render_digitime: function(self, t) {
                var digitime = $('#digitime');
                digitime.append('12:00');
            },

            _render_datepicker: function(self, t) {
                var datepicker = $('#datepicker');
                datepicker.datepicker();
                datepicker.css({"font-size":"12px"});
            },

            _render_clockpicker: function(self, t) {
                var clockpicker = $('#clockpicker');
                clockpicker.append('<canvas id="clockcanvas" width="'
                                   +this.options.clockpicker_height
                                   +'px" height="'
                                   +this.options.clockpicker_width
                                   +'px"></canvas>');

                tm_canvas =  $('#clockcanvas');
                tm_ctx = tm_canvas[0].getContext("2d");
                tm_canvas[0].onmousedown = self.mouseDown;
                tm_canvas[0].onmouseup = self.mouseUp;
                tm_canvas[0].onmousemove = self.mouseMove;
                tm_center = {x:tm_canvas[0].height/2,
                             y:tm_canvas[0].height/2};
                tm_current=90;
                tm_drag.handles = {
                    90:{area: [],
                        x: tm_center.x,
                        y: 0,
                        enabled: false,
                       },
                    70:{area: [],
                        x: tm_center.x,
                        y: 200,
                        enabled: false,
                       }
                };
                self.render();
                clockpicker.find('canvas').mouseenter(function(){tm_showOverlay = true;
                                                                 tm_self.render();});
                clockpicker.find('canvas').mouseleave(function(){tm_showOverlay = false;
                                                                 tm_self.render();});

            },

            setEnabled: function(handle){
                    tm_drag.handles[70].enabled = false;
                    tm_drag.handles[90].enabled = true;
            },

            mouseDown: function(e){
                tm_drag.enabled = true;
                xy = {x:e.clientX-tm_canvas[0].offsetLeft,
                      y:e.clientY-tm_canvas[0].offsetTop}

                if (tm_self._union(xy.x,
                                   xy.y,
                                   tm_drag.handles[90].area)){
                    tm_drag.handles[70].enabled = false;
                    tm_drag.handles[90].enabled = true;
                    tm_drag.handles[90].x = e.clientX-tm_canvas[0].offsetLeft;
                    tm_drag.handles[90].y = e.clientY-tm_canvas[0].offsetTop;
                    tm_current = 90;
                }
                if (tm_self._union(xy.x,
                                   xy.y,
                                   tm_drag.handles[70].area))
                {
                    tm_drag.handles[90].enabled = false;
                    tm_drag.handles[70].enabled = true;
                    tm_drag.handles[70].x = e.clientX-tm_canvas[0].offsetLeft;
                    tm_drag.handles[70].y = e.clientY-tm_canvas[0].offsetTop;
                    tm_current = 70;
                }
                tm_self.render();
            },

            mouseUp: function(){
                tm_drag.handles[90].enabled = false;
                tm_drag.handles[70].enabled = false;
                tm_current = 90;
                tm_drag.enabled = false;
                tm_self.render();
            },

            mouseMove: function(e){
                if( tm_drag.enabled){//tm_drag.handles.current==90 || tm_drag.handles.current==70 ){
                    tm_drag.handles[tm_current].x = e.clientX-tm_canvas[0].offsetLeft;
                    tm_drag.handles[tm_current].y = e.clientY-tm_canvas[0].offsetTop;
                    tm_self.render();
                }
            },

            _deltaXY: function(x,y){
                return {x: x-tm_center.x, y: y-tm_center.y}
            },

            _transform_by: function(x,y,r,z){
                delta = tm_self._deltaXY(x,y);
                hypo = Math.sqrt(Math.pow(delta.x,2)+Math.pow(delta.y,2));
                return ((delta[z]/hypo)*r)+tm_center.x;
            },

            render_overlay_handle: function(x, y, r){
                tm_ctx.save();
                tm_ctx.beginPath();

                var circle_w = 6;
                tm_ctx.arc(x, y, circle_w, 0, 2*Math.PI, false);

                if(tm_drag.handles[r].enabled)
                {
                    tm_ctx.fillStyle = "#ff1111";
                    tm_ctx.globalAlpha = 0.9;
                }else{
                    tm_ctx.fillStyle = "#ff4444";
                    tm_ctx.globalAlpha = 0.8;
                }
                tm_ctx.fill();
                tm_ctx.restore();
                tm_drag.handles[r]['area'] = [x-circle_w, x+circle_w, 
                                              y-circle_w, y+circle_w];
            },

            render_hand: function(x, y, r) {
                var height = this.options.clockpicker_height/2;
                tm_ctx.beginPath();
                var _x = this._transform_by(x,y,r,'x');
                var _y = this._transform_by(x,y,r,'y');
                tm_ctx.moveTo(tm_center.x, tm_center.y);
                tm_ctx.lineTo(_x, _y);
                tm_ctx.lineWidth = 2;
                tm_ctx.strokeStyle = "#000000";
                tm_ctx.lineCap = "round";
                tm_ctx.stroke();
                if( tm_showOverlay ){
                    this.render_overlay(_x, _y, r);
                }
            },

            _union: function(x,y,area) {
                return (x>=area[0] && x<=area[1] && y>=area[2] && y<=area[3])
            },

            render: function() {
                tm_ctx.height = tm_center.x*2;
                this._draw_clockbackground(tm_canvas,tm_ctx);
                $.each(Object.keys(tm_drag.handles), function(key, value){
                    console.log(key, value);
                    tm_self.render_hand(tm_drag.handles[value].x, tm_drag.handles[value].y, value);
                });
            },

            render_overlay: function(x,y,r) {
                tm_ctx.save();
                tm_ctx.beginPath();
                tm_ctx.globalAlpha = 0.3;
                tm_ctx.arc(tm_center.x, tm_center.y, r, 0, 2*Math.PI, false);
                tm_ctx.lineWidth = 10;
                tm_ctx.strokeStyle = "black";
                tm_ctx.stroke();
                tm_ctx.restore();
                this.render_overlay_handle(x, y, r);
            },

            _draw_clockbackground: function(canvas, ct) {
                //background
                ct.save();
                ct.fillStyle = "#555555";
                ct.beginPath();
                ct.arc(tm_center.x, tm_center.y, 100, 0, Math.PI*2, true);
                ct.closePath();
                ct.beginPath();
                ct.fill();
                ct.fillStyle = "#ffffff";
                ct.arc(tm_center.x, tm_center.y, 98, 0, Math.PI*2, true);
                ct.closePath();
                ct.fill();
                ct.restore();
                //dots // this must be refactored to be dynamic
                this.dot(ct, 100, 0, 90);  
                this.dot(ct, 0, 100, 0);  
                this.dot(ct, 194, 100, 0);  
                this.dot(ct, 100, 194, 90);  
                this.dot(ct, 30, 30, 45);  
                this.dot(ct, 170, 162, 45);  
                this.dot(ct, 30, 170, -45);  
                this.dot(ct, 162, 30, -45);  


            },

            dot: function(ct, x, y, r) {  
                ct.save();  
                ct.translate(x, y);  
                ct.rotate(r * Math.PI / 180);  
                ct.fillStyle = "black";  
                ct.fillRect(0, 0, 6, 2);  
                ct.restore();  
            },

            hourAsDegree: function(hour){
                return hour;
            }
    }), { version: "0.0.1"});
})(jQuery);
