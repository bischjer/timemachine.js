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
    var tm_now = new Date();

    $.extend(
        $.widget( "ui.timemachine", {
            options: {
                clockpicker_height: 200,
                clockpicker_width: 200,
                container_width: 450,
                context: null,
            },

            _init: function() {
                var timemachine = this.element;
                timemachine.css({"width":(this.options.container_width-48)+"px",
                                 "padding":"2px 6px 4px 6px",
                                 "background":"#cccccc",
                                 "border":"0px solid black"});
                timemachine.addClass("ui-corner-all");
                timemachine.append('<div id="tm_clockpicker"></div>');
            },

            _create: function() {
                tm_self = this;
                this._init();
                this._render_clockpicker(this, tm_timemachine);
            },

            _render_clockpicker: function(self, t) {
                var clockpicker = $('#tm_clockpicker');
                clockpicker.css({"width":self.options.clockpicker_height+"px",
                                 "padding":"4px",
                                 "background":"#ffffff"});
                clockpicker.addClass("ui-corner-all");
                clockpicker.append('<canvas id="clockcanvas" width="'+
                                   this.options.clockpicker_height+
                                   'px" height="'+
                                   this.options.clockpicker_width+
                                   'px"></canvas>');
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
                        thickness: 2,
                       },
                    70:{area: [],
                        x: tm_center.x,
                        y: 200,
                        enabled: false,
                        thickness: 2.5,
                       }
                };
                self.render();
                clockpicker.find('canvas').mouseenter(function(){tm_showOverlay = true;
                                                                 tm_self.render();});
                clockpicker.find('canvas').mouseleave(function(){tm_showOverlay = false;
                                                                 tm_self.render();});
            },

            angle2Time: function(x1,y1,x2,y2){
                dx1 = tm_self._deltaXY(x1,y1);
                dx2 = tm_self._deltaXY(x2,y2);
                th1 = {x: dx1.x/(Math.sqrt(Math.pow(dx1.x,2)+Math.pow(dx1.y,2))),
                       y: dx1.y/(Math.sqrt(Math.pow(dx1.x,2)+Math.pow(dx1.y,2)))}
                th2 = {x: dx2.x/(Math.sqrt(Math.pow(dx2.x,2)+Math.pow(dx2.y,2))),
                       y: dx2.y/(Math.sqrt(Math.pow(dx2.x,2)+Math.pow(dx2.y,2)))}

                if( Math.asin(th1.x) < 0){
                    tm_min = 60-60*((Math.acos(-th1.y)))/(2*Math.PI);
                }else{
                    tm_min = 60-60*(2*Math.PI-(Math.acos(-th1.y)))/(2*Math.PI);
                }

                if( Math.asin(th2.x) < 0){
                    tm_hour = 12-12*(Math.acos(-th2.y))/(2*Math.PI);
                }else{
                    tm_hour = 12-12*((2*Math.PI-Math.acos(-th2.y)))/(2*Math.PI);
                }
                tm_now.setSeconds(0);
                tm_now.setHours(tm_hour);
                tm_now.setMinutes(tm_min);
                console.log(tm_now);
            },

            updateTime: function(){
                tm_self.angle2Time(tm_drag.handles[90].x,
                                   tm_drag.handles[90].y,
                                   tm_drag.handles[70].x,
                                   tm_drag.handles[70].y);
            },

            setEnabled: function(handle){//TODO: this is not in play at the moment
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
                tm_self.render();
            },

            mouseMove: function(e){
                if( tm_drag.handles[90].enabled || tm_drag.handles[70].enabled ){
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
                tm_ctx.lineWidth = tm_drag.handles[r].thickness;
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
                    tm_self.render_hand(tm_drag.handles[value].x, tm_drag.handles[value].y, value);
                });
                tm_self.updateTime();
            },

            render_overlay: function(x,y,r) {
                tm_ctx.save();
                tm_ctx.beginPath();
                if( tm_drag.handles[r].enabled ){
                    tm_ctx.globalAlpha = 0.2;
                }else{
                    tm_ctx.globalAlpha = 0.1;
                }
                tm_ctx.arc(tm_center.x, tm_center.y, r, 0, 2*Math.PI, false);
                tm_ctx.lineWidth = 10;
                tm_ctx.strokeStyle = "black";
                tm_ctx.stroke();
                tm_ctx.restore();
                this.render_overlay_handle(x, y, r);
            },

            _draw_clockbackground: function(canvas, ct) {
                ct.save();
                ct.beginPath();
                ct.fill();
                lingrad = ct.createLinearGradient(0,0,0,150);
                lingrad.addColorStop(0, '#ededed');
                lingrad.addColorStop(0.65, '#ededed');
                lingrad.addColorStop(0.65, '#e9e9e9');
                lingrad.addColorStop(1, '#ececec');

                ct.fillStyle = lingrad;//"#d0d0d0";//solid color


                ct.arc(tm_center.x,
                       tm_center.y,
                       tm_self.options.clockpicker_width/2-1,
                       0,
                       Math.PI*2, true);
                ct.lineWidth=2;
                ct.strokeStyle = "#d3d3d3";
                ct.stroke();
                ct.closePath();
                ct.fill();
                ct.restore();
                //dots // this must be refactored to be dynamic and to support user set clocksize

                this.dot(ct, 100, 0, 90, 3);  
                this.dot(ct, 0, 100, 0, 3);  
                this.dot(ct, 194, 100, 0, 3);  
                this.dot(ct, 100, 194, 90, 3);  
                this.dot(ct, 52, 15, 60, 2);  
                this.dot(ct, 17, 48, 35, 2);  
                this.dot(ct, 145, 19, -60, 2);  
                this.dot(ct, 180, 53, -35, 2); 
                this.dot(ct, 180, 150, 30, 2);  
                this.dot(ct, 145, 180, 60, 2);  
                this.dot(ct, 15, 148, -30, 2);
                this.dot(ct, 50, 184, -60, 2);  
                /*
                this._numbers(ct, 88, 25, "12");
                this._numbers(ct, 180, 108, "3");
                this._numbers(ct, 94, 195, "6");
                this._numbers(ct, 10, 108, "9");
                */
            },

            _numbers: function(ct, x, y, number){
                ct.save();
                ct.font = "18pt Arial";


                ct.translate(x,y);

                ct.mozDrawText(number);
                ct.restore();
            },

            dot: function(ct,x,y,r,t) {
                ct.save();
                ct.translate(x,y);
                ct.rotate(r*Math.PI/180);
                ct.fillStyle="black";
                ct.fillRect(0,0,6,t);
                ct.restore();
            }
    }), { version: "0.0.1"});
})(jQuery);
