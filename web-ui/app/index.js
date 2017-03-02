var module = angular.module('BtCurrentMonitorApp', ['ngStorage', 'toaster', 'ngAnimate']);

//---------------------------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------------------------

module.run(autoConnect);

function autoConnect($log, $localStorage, mqttService) {
    if ($localStorage.mqttSettings) {
        if ($localStorage.mqttSettings.hostname !== undefined && $localStorage.mqttSettings.hostname !== '') {
            $log.log('auto connect');
            mqttService.connect($localStorage.mqttSettings);
        }
    }
}

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

module.controller('mqttController', mqttController);

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

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------


module.controller('graphsController', graphsController);

function graphsController(graphService, captureService) {
    var vm = this;
    vm.settings = graphService;
    vm.captureService = captureService;
}

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------


module.controller('sliderController', sliderController);

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


//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

module.controller('currentGraphController', currentGraphController);

function currentGraphController($scope, $interval, graphService, captureService) {

    var currentScale = d3.scale.linear().domain([graphService.current.min, graphService.current.max]).nice();
    var voltageScale = d3.scale.linear().domain([graphService.voltage.min, graphService.voltage.max]).nice();

    var graph = new Rickshaw.Graph({
        element: angular.element('#graph').get(0),
        renderer: 'line',
        height: '400',
        padding: {
            top: 0.1
        },
        min: 0,
        max: 1,
        series: [{
            data: [],
            color: 'steelblue',
            name: 'current',
            scale: currentScale
        },
        {
            data: [],
            color: 'red',
            name: 'voltage',
            scale: voltageScale
        }
        ]

    });

    new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        xFormatter: function(x) { return x + ' ms'; },
    } );

    new Rickshaw.Graph.Axis.Y.Scaled({
        graph: graph,
        orientation: 'left',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        scale: currentScale,
        element: angular.element('#graph-y-axis-current').get(0)
    });
    new Rickshaw.Graph.Axis.Y.Scaled({
        graph: graph,
        orientation: 'right',
        tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
        scale: voltageScale,
        element: angular.element('#graph-y-axis-voltage').get(0)
    });

    graph.render();

    function updateCurrentScale() {
        currentScale.domain([graphService.current.min, graphService.current.max]);
        graph.update();
    }

    $scope.$watch(function () {
        return graphService.current.min;
    }, updateCurrentScale);
    $scope.$watch(function () {
        return graphService.current.max;
    }, updateCurrentScale);

    function updateVoltageScale() {
        voltageScale.domain([graphService.voltage.min, graphService.voltage.max]);
        graph.update();
    }

    $scope.$watch(function () {
        return graphService.voltage.min;
    }, updateVoltageScale);
    $scope.$watch(function () {
        return graphService.voltage.max;
    }, updateVoltageScale);

    function update() {
        graph.series[0].data = captureService.getCurrent(graphService.length, graphService.offset);
        graph.series[1].data = captureService.getVoltage(graphService.length, graphService.offset);
        graph.update();
    }

    $interval(update, 200);
}

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

module.factory('mqttService', mqttService);

function mqttService($log, $rootScope, toaster, captureService) {
    var service = {};
    service.connect = connect;
    service.disconnect = disconnect;
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
        service.client.subscribe('#');
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
        var data = JSON.parse(message.payloadString);
        captureService.push(data);
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

    return service;
}

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

module.factory('graphService', graphService);

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

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

module.factory('captureService', captureService);

function captureService() {
    var service = {
        captureSize: 50000,
        captureLength: captureLength,
        push: push,
        getCurrent: getCurrent,
        getVoltage: getVoltage
    };


    var currentBuffer = new Array();
    var voltageBuffer = new Array();

    function captureLength() {
        return currentBuffer.length;
    }

    function push(message) {
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

//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------




//---------------------------------------------------------------------------------------------
//
//---------------------------------------------------------------------------------------------

function RingBuffer(capacity) {
    this._array = new Array(capacity);
    this._start = 0;
    this._size = 0;
}

RingBuffer.prototype.push = function (item) {
    var newSize = this._size + 1;
    if (this._size === this._array.length) {
        this._start = (this._start + 1) % this._array.length;
        newSize = this._size;

    }
    var index = (this._start + this._size) % this._array.length;
    this._array[index] = item;
    this._size = newSize;
};

RingBuffer.prototype.last = function (count) {
    if (count > this._size) {
        count = this._size;
    }
    var start = (this._start + this._size - count) % this._array.length;
    var rawArray = this._array;
    return {
        length: count,
        filter: function (callback, thisArg) {
            var result = new Array();
            for (var index = 0; index < count; index++) {
                var item = rawArray[(start + index) % rawArray.length];
                if (callback.call(thisArg, item, index, rawArray)) {
                    result.push(item);
                }
            }
            return result;
        }
    };
};