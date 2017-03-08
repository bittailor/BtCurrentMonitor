angular
    .module('BtCurrentMonitorApp')
    .factory('graphService', graphService);

function graphService() {
    var service = {
        length: 1000,
        offset: 0,
        current: {
            min: -0.5,
            max: 5,
        },
        voltage: {
            min: 3.2,
            max: 3.4,
        }
    };
    return service;
}