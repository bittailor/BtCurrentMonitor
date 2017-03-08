angular
    .module('BtCurrentMonitorApp')
    .controller('sliderController', sliderController);

function sliderController(graphService, captureService) {
    var vm = this;
    vm.max = function () {
        return 0;
    };
    vm.min = function () {
        if (graphService.length > captureService.captureLength()) {
            return 0;
        }
        return -1 * (captureService.captureLength() - graphService.length);
    };
    vm.value = function (newValue) {
        if (arguments.length) {
            graphService.offset = -1 * newValue;
        } else {
            return -1 * graphService.offset;
        }
    };
}
