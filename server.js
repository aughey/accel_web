const express = require('express')
const app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
const { spawn } = require('child_process');
var readline = require('readline');

app.use(express.static('public'));

var accel = null;

var connection_count = 0;
io.on('connection', function(socket) {
  console.log("connection");
  connection_count++;
  if(!accel) {
    startAccel();
  }
  socket.on('disconnect', () => {
    console.log("Socket io disconnected");
    connection_count--;
    if(connection_count == 0) {
      console.log("Stopping accel read");
      accel.kill("SIGINT");
      accel = null;
    }
  })
});

server.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})

function startAccel() {
	console.log("Starting read from accel");
	accel = spawn("../i2c-tools/tools/i2caccel")
	var rl = readline.createInterface({
	  input: accel.stdout
	  });
	accel.stderr.on('data', (data) => {
	 // Just eat it
	});

	rl.on('line', (data) => {
	  io.emit('stream',data.toString());
	});
}
