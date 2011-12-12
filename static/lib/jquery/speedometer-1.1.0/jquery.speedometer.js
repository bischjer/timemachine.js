/*

***Requires excanvas.js***

jQuery Speedometer v1.1.0 (2011/07/11)
by Jacob King
http://www.jacob-king.com/

Tested on IE 7-9, Firefox 3-5, Chrome 8-11.

Usage: 
	$([selector]).speedometer([options object]);

Options:
	percentage: (float/int, default: 0) 
		Value to display on speedometer and digital readout. Can also be specified as the selector's innerHTML.
	scale: (float/int, default 100)
		The value considered to be 100% on the speedometer.
	limit: (float/int, default true)
		Specifies that the speedometer will "break" if the value is out of bounds.
	minimum: (float/int, default 0)
		The lowest value the needle can go without the glass cracking.
	maximum: (float/int, default 100)
		The highest value the needle can go without the glass cracking.
	animate: (boolean, default: true)
		Specifies that the speedometer needle will animate from current value to intended value.	
	suffix: (string, default ' %')
		A unit to display after the digital readout's value. Set to an empty string for none.

    *** Modifying these properties is not yet tested/documented:
	thisCss: Default settings object for speedometer.
	needleProperties: Default settings for canvas/needle.
	digitalCss: Default settings object for digital readout.
	
*/

(function ($) {

    var canvas_id;

    $.fn.speedometer = function ( options ) {

        /* A tad bit speedier, plus avoids possible confusion with other $(this) references. */
        var $this = $(this);

        if (canvas_id == null) {
            canvas_id = $('canvas').size();
        }


        /* handle multiple selectors */
        if ($this.length > 1) {
            $this.each(function () {
                $(this).speedometer(options);

            });
            return $this;
        }

        var def = {
            /* If percentage not specified, look in selector's innerHTML before defaulting to zero. */
            percentage: $.trim($this.html()) || 0,
            scale: 100,
            limit: true,
            minimum: 0,
            maximum: 100,
            suffix: ' %',
            animate: true,
            digitalRoll: true,
            thisCss: {
                position: 'relative', /* Very important to align needle with gague. */
                width: '210px',
                height: '180px',
                padding: '0px',
                border: '0px',
                fontFamily: 'Arial',
                fontWeight: '900',
                backgroundImage: "url('./background.jpg')"
            },
            needleProperties: {
                fulcrumX: 105,
                fulcrumY: 105,
                strokeStyle: "rgb(255,0,0)"
            },
            digitalCss: {
                backgroundColor: 'black',
                borderColor: '#555555 #999999 #999999 #555555',
                borderStyle: 'solid',
                borderWidth: '2px',
                color: 'white',
                fontSize: '16px',
                height: '20px',
                left: '72px',
                padding: '1px',
                position: 'absolute',
                textAlign: 'center',
                top: '65px',
                width: '60px',
                zIndex: '0',
                lineHeight: '20px',
                overflow: 'hidden'
            }
        }



        $this.html('');

        $this.css(def.thisCss);

        $.extend(def, options);

        def.percentage = parseFloat(def.percentage, 10)

        /* digital percentage displayed in middle of image */
        var digitalGauge = $('<div></div>');
        $this.append(digitalGauge);
        digitalGauge.css(def.digitalCss);



        /* not a number */
        if (isNaN(def.percentage)) 
        {
            $this.css('backgroundImage', 'url("./background-broken.jpg")');
            digitalGauge.text("error");
        } 

        /* out of range */
        else if (def.limit && (def.percentage > def.maximum || def.percentage < def.minimum)) 
        {
            /* the glass cracks */
            $this.css('backgroundImage', 'url("./background-broken.jpg")');
            digitalGauge.text(def.percentage + def.suffix);

        } else {

            var el = document.createElement('canvas');
            el.setAttribute("width", parseInt($this.css("padding-left")) + parseInt($this.css("padding-right")) + $this.width());
            el.setAttribute("height", parseInt($this.css("padding-bottom")) + parseInt($this.css("padding-top")) + $this.height());
            el.setAttribute("id", "jquery-speedometer-" + canvas_id);

            // Fire up excanvas for IE7 & IE8 support.
            if ($.browser.msie && $.browser.version < 9) {
                G_vmlCanvasManager.initElement(el);
            };

            var canvas = $(el);
            $this.append(canvas);

            canvas.css({
                zIndex: 1,
                position: "relative"//,
                //left: new_position_left,
                // top: new_position_top
            });

            var ctx = el.getContext("2d"),
		    lingrad,
            thisWidth;

            ctx.lineWidth = 2;
            ctx.strokeStyle = def.needleProperties.strokeStyle;

            /* point of origin for drawing AND canvas rotation (lines up with middle of the black circle on the image) */
            ctx.translate(def.needleProperties.fulcrumX, def.needleProperties.fulcrumY);

            ctx.save(); //remember linewidth, strokestyle, and translate



            function _animate() {

                ctx.restore(); //reset ctx.rotate to properly draw clearRect
                ctx.save(); //remember this default state again

                ctx.clearRect(-105, -105, 300, 300); //erase the canvas

                /* rotate based on percentage. */
                ctx.rotate(i * Math.PI / def.scale);



                /* Draw the needle. This is zero position when ctx.rotate is zero. */
                ctx.beginPath();
                ctx.moveTo(-80, 0);
                ctx.lineTo(10, 0);
                ctx.stroke();

                /* internally remember current needle value */
                $this.data('currentPercentage', i);

                /* update digital gauge */
                if (def.digitalRoll) {
                    digitalGauge.text(i + def.suffix);
                }

                if (i != def.percentage) {

                    //properly handle fractions
                    i += Math.abs(def.percentage - i) < 1
                        ? def.percentage - i
                        : def.increment;

                    setTimeout(function () {
                        _animate()
                    }, 20);
                }


            }

            /* Are we animating or just displaying the percentage? */
            if (def.animate) {
                var i = parseInt($this.data('currentPercentage')) || 0;
                def.increment = (i < def.percentage) ? 1 : -1;
                if (def.digitalRoll) {
                    digitalGauge.text(i + def.suffix);
                }
                else {
                    digitalGauge.text(def.percentage + def.suffix);
                }
            }
            else {
                var i = (def.percentage);
                digitalGauge.text(def.percentage + def.suffix);
            }


            _animate();

        }
        return $this;
    }

})(jQuery)