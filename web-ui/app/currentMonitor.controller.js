angular
    .module('BtCurrentMonitorApp')
    .controller('currentMonitorController', currentMonitorController);

function currentMonitorController(mqttService, currentMonitorService) {
    var vm = this;
    vm.start = {
        can : function() {
            return mqttService.state === 'connected' && currentMonitorService.state() === 'idle' ; 
        },
        execute: function() {
            currentMonitorService.start();
        } 
    };
    vm.stop = {
        can : function() {
            return currentMonitorService.state() === 'measure' ; 
        },
        execute: function() {
            currentMonitorService.stop();
        } 
    };

    vm.state = currentMonitorService.state;
}