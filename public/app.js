var socketio = require('socket.io-client');
var Vue = require('vue/dist/vue');
var SmoothieChart = require('smoothie');
var EventEmitter = require('events');

var events = new EventEmitter();

var socket = socketio.connect();
  socket.on('connect', () => {
  console.log("Connected to remote");
});

Vue.component('my-chart', {
  template: "<div><h3>{{title}}</h3><div>{{value}} {{overrun_count}}</div><canvas class='chart' style='width:500px; height:100px;'></canvas></div>",
  props: {
    series: String,
    index: Number
  },
  data: function() {
    return {
      title: this.series + " " + this.index,
      value: 0,
      overrun_count: 0
    }
  },
  mounted: function() {
    console.log("Chart created");
    var chart = new SmoothieChart.SmoothieChart(); // {minValue:-2,maxValue:2});
    chart.streamTo(this.$el.getElementsByTagName('canvas')[0]);
    
    var timeseries = new SmoothieChart.TimeSeries();
    this.chart = chart;
    this.timeseries = timeseries;

    chart.addTimeSeries(timeseries,{lineWidth:2,strokeStyle:'#00ff00'});

    var index = this.index;
    var handler = (data) => {
       var value = data.data[index];
       if(data.overrun) {
         this.overrun_count = this.overrun_count + 1
       }
       timeseries.append(new Date().getTime(),value);
       this.value = value
    }
    events.on(this.series, handler);

    this.unsubscribe = function() {
      events.removeListener(this.series,handler);
    }
  },
  destroyed: () => {
    console.log("Chart destroyed");
    this.unsubscribe();
  }
});

var app = new Vue({
  el: '#app',
  data: {
    vuedata: "Testing"
  }
});

socket.on('stream', (data) => {
  data = JSON.parse(data);
  if(data.accel) {
    events.emit('accel',data.accel);
  } else if(data.gyro) {
    events.emit('gyro',data.gyro);
  }
});
