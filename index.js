const http = require("http");
const fs = require("fs");
const cluster = require("cluster");
const os = require("os");

const cpus = os.cpus().length;
const port = 8080;
const index = fs.readFileSync("./index.html");


if (cluster.isMaster) {
  console.log(`Number of CPUs is ${cpus}`);
  console.log(`Master ${process.pid} is running`);
  var currentRequests = 0;

  let requests = 0;
  let childs = [];
  for (let i = 0; i < cpus; i++) {
    let child = cluster.fork();
    child.on("message", (msg) => {
      requests++;
    });
    childs.push(child);
  }

  setInterval(() => {
    currentRequests = requests;
    childs.forEach(c => {
      c.send(currentRequests);
    })
    requests = 0;
  }, 1000);
} else {
  var currentRequests = 0;
  console.log(`Worker ${process.pid} started`);

  const handler = function (req, res) {
    if (req.url == "/hit") {
      process.send(0);
      res.end();
    }else if(req.url == "/stats"){
      res.end(currentRequests+"");
    } else {
      res.setHeader("content-type", 'text/html');
      res.end(index);
    }
  };

  const server = http.createServer(handler);

  process.on("message", (requests) => {
    currentRequests = requests;
  });

  server.listen(port);
}
