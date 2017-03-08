angular
    .module('BtCurrentMonitorApp')
    .controller('currentGraphController', currentGraphController);

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
