angular
    .module('BtCurrentMonitorApp')
    .run(autoConnect);

function autoConnect($log, $localStorage, mqttService) {
    if ($localStorage.mqttSettings) {
        if ($localStorage.mqttSettings.hostname !== undefined && $localStorage.mqttSettings.hostname !== '') {
            $log.log('auto connect');
            mqttService.connect($localStorage.mqttSettings);
        }
    }
}
