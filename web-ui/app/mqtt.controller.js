angular
    .module('BtCurrentMonitorApp')
    .controller('mqttController', mqttController);

function mqttController($localStorage, mqttService) {
    if (!$localStorage.mqttSettings) {
        $localStorage.mqttSettings = {
            hostname: undefined,
            port: 8080
        };
    }

    var vm = this;
    vm.settings = $localStorage.mqttSettings;
    vm.service = mqttService;
    vm.connect = function () {
        mqttService.connect(vm.settings);
    };
    vm.disconnect = function () {
        mqttService.disconnect();
    };
}
