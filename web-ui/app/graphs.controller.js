angular
    .module('BtCurrentMonitorApp')
    .controller('graphsController', graphsController);

function graphsController($log, graphService, captureService) {
    var vm = this;
    vm.settings = graphService;
    vm.captureService = captureService;
    
    vm.increaseAxisMax = function(axis) {
        var delta = getAxisDelta(axis);
        axis.max = axis.max + delta;
    };
    vm.decreaseAxisMax = function(axis) {
        var delta = getAxisDelta(axis);
        axis.max = axis.max - delta;
    };

    vm.increaseAxisMin = function(axis) {
        var delta = getAxisDelta(axis);
        axis.min = axis.min + delta;
    };
    vm.decreaseAxisMin = function(axis) {
        var delta = getAxisDelta(axis);
        axis.min = axis.min - delta;
    };

    function getAxisDelta(axis) {
        return Math.pow(10, Math.trunc(Math.log10(axis.max -  axis.min)) -1); 
    }

    vm.decreaseViewLength = function () {
        vm.settings.length = vm.settings.length - getDecrement(vm.settings.length);
    };
    
    vm.increaseViewLength = function () {
        vm.settings.length = vm.settings.length + getIncrement(vm.settings.length);    
    };

    function getIncrement(length) {
        var increment = getDelta(length); 
        if((length/increment) < 2) {
            increment = increment / 10;
        }
        return increment;
    }

    function getDecrement(length) {
        var increment = getDelta(length); 
        if((length/increment) <= 2) {
            increment = increment / 10;
        }
        return increment;
    }

    function getDelta(length) {
        return Math.pow(10, Math.trunc(Math.log10(length))); 
    }
}