angular
    .module('BtCurrentMonitorApp')
    .controller('graphsController', graphsController);

function graphsController(graphService, captureService) {
    var vm = this;
    vm.settings = graphService;
    vm.captureService = captureService;
}