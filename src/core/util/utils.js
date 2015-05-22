/* Utilities */
$.GUI().create('Util', function(GUI){
    var utils = {
        merge:function(){
            $.extend(arguments);
        },
        getPxValue:function(width, unit){
            var value;

            switch(unit){
                case "em":
                    value = this.convertToEm(width);
                    break;

                case "pt":
                    value = this.convertToPt(width);
                    break;

                default:
                    value = width;
            }

            return value;
        },
        getFontsize:function(elem){
            return parseFloat(
                getComputedStyle(elem || this.dom.elem).fontSize
            );
        },

        convertToEm:function(value){
            return value * this.getFontsize();
        },

        convertToPt:function(value){
        
        },

        convertBase:function(){
            var pixels, 
                elem = this.dom.elem,
                style = elem.getAttribute('style');

            elem.setAttribute('style', style + ';font-size:1em !important');

            base = this.getFontsize();

            elem.setAttribute('style', style);

            return base;
        }

    };

    return {
        load:utils,
        unload:function(){}
    }
});
