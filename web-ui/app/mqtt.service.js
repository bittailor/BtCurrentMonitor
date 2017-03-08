angular
    .module('BtCurrentMonitorApp')
    .factory('mqttService', mqttService);

function mqttService($log, $rootScope, toaster, captureService) {
    var sensorTopic = '/bt/multimeter/sensors';
    var stateTopic = '/bt/multimeter/state';
    
    var service = {};
    service.connect = connect;
    service.disconnect = disconnect;
    service.publish = publish;
    service.state = 'disconnected';
    service.failure = undefined;
    service.settings = {
        'hostname': 'piOne',
        'port': 8080
    };

    $rootScope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof (fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    function onConnect() {
        $log.log('... MQTT connected');
        service.client.subscribe(sensorTopic);
        service.client.subscribe(stateTopic);
        $rootScope.safeApply(function () {
            service.state = 'connected';
            service.failure = undefined;
        });
    }

    function onFailure(response) {
        $log.error('connect failed with');
        $log.error('  ', response.errorCode, ' ', response.errorMessage);
        $rootScope.safeApply(function () {
            service.state = 'disconnected';
            service.failure = response.errorMessage;
            toaster.pop('error', 'MQTT failure', response.errorMessage);
        });
    }

    function onConnectionLost(response) {
        if(service.state === 'disconnected') {
            $log.log('... MQTT disconnected');
            return;
        }
        $log.error('MQTT connection lost ', response.errorCode, ' ', response.errorMessage);
        $rootScope.safeApply(function () {
            service.state = 'disconnected';
            service.failure = response.errorMessage;
        });
    }

    function onMessageArrived(message) {
        if(message.destinationName === sensorTopic) {
            var sensorData = JSON.parse(message.payloadString);
            captureService.push(sensorData);
        }
        if(message.destinationName === stateTopic) {
            $rootScope.safeApply(function(){
                var stateData = JSON.parse(message.payloadString);
                captureService.stateUpdate(stateData);
            });    
        }
    }

    function connect(settings) {
        $log.log('MQTT connect ...');
        service.state = 'connecting';
        service.client = new Paho.MQTT.Client(settings.hostname, settings.port, 'web-current-monitor');
        service.client.onConnectionLost = onConnectionLost;
        service.client.onMessageArrived = onMessageArrived;
        service.client.connect({
            onSuccess: onConnect,
            onFailure: onFailure
        });
    }

    function disconnect() {
        $log.log('MQTT disconnect ...');
        service.state = 'disconnected';
        service.client.disconnect();
    }

    function publish(topic, payload) {
        var message = new Paho.MQTT.Message(payload);
        message.destinationName = topic;
        message.qos = 1;
        service.client.send(message);
    }

    return service;
}