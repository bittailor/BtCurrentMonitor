angular
    .module('BtCurrentMonitorApp')
    .factory('captureService', captureService);

function captureService() {
    var service = {
        captureSize: 50000,
        l:0,
        state: 'offline',
        captureLength: captureLength,
        clear: clear,
        push: push,
        stateUpdate: stateUpdate,
        getCurrent: getCurrent,
        getVoltage: getVoltage,
        
    };

    var currentBuffer = new Array();
    var voltageBuffer = new Array();

    function captureLength() {
        return currentBuffer.length;
    }

    function clear() {
        currentBuffer = new Array();
        voltageBuffer = new Array();
    }

    function push(message) {
        service.l = message.l;
        currentBuffer.push({
            x: message.t,
            y: message.c
        });
        while (currentBuffer.length > service.captureSize) {
            currentBuffer.shift();
        }
        voltageBuffer.push({
            x: message.t,
            y: message.v
        });
        while (voltageBuffer.length > service.captureSize) {
            voltageBuffer.shift();
        }
    }

    function stateUpdate(message) {      
        service.state = message.state; 
    }

    function getCurrent(count, offset) {
        if (count > currentBuffer.length) {
            count = currentBuffer.length;
        }
        if (offset === undefined) {
            offset = 0;
        }
        if ((offset + count) > currentBuffer.length) {
            offset = currentBuffer.length - count;
        }
        return currentBuffer.slice(currentBuffer.length - count - offset, currentBuffer.length - offset);
    }

    function getVoltage(count, offset) {
        if (count > voltageBuffer.length) {
            count = voltageBuffer.length;
        }
        if (offset === undefined) {
            offset = 0;
        }
        if ((offset + count) > currentBuffer.length) {
            offset = currentBuffer.length - count;
        }
        return voltageBuffer.slice(voltageBuffer.length - count - offset, voltageBuffer.length - offset);
    }


    return service;
}