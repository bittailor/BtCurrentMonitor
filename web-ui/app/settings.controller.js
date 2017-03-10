angular
    .module('BtCurrentMonitorApp')
    .controller('settingsController', settingsController);

function settingsController() {
    var vm = this;
    vm.show = false;
}