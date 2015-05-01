/* --------------------------------------- *
* Guerrilla JS                             *
* @author: Garrett Haptonstall (FearDread) *
* @module: Guerrilla.network.Broker        *
* ---------------------------------------- */
(function(factory){

  if(typeof define === 'function' && define.amd){
    define(['guerrilla'], factory);

  }else if(typeof exports === 'object'){
    module.exports = factory(require('guerrilla'));

  }else{
    factory(Guerrilla);
  }

}(function(){

    Guerrilla.network = (Guerrilla.network) ? Guerrilla.network : {};

    Guerrilla.network.broker = function(){
      var cache = [];

      this.prototype = {

        fire:function(handle, args){
          if(cache[handle]){
            var idx = 0,
                params = args || [],
                current_event = cache[handle],
                length = current_event.length;
          
            while(length--){
              current_event[idx].call(this, params);

              idx++;
            };
          }
        },

        register:function(handle, callback){
          if(!cache[handle]){
            cache[handle] = [];
          }

          cache[handle].push(callback);
        
          return {
            event:handle,
            callback:callback
          }
        },

        unregister:function(handle){
          if(cache[handle.event]){
            var idx = 0,
                current_event = cache[handle.event],
                length = current_event.length;

            while(length--){
            
              if(current_event[idx] == handle.callback){
                current_event.splice(idx, 1);
              }

              idx++;
            }
          }
        }
      };

      return Object.create(this.prototype);

    };
  })
);
