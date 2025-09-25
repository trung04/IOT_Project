const express = require('express');
const mqtt = require("mqtt");
const brokerUrl = 'mqtts://1b960938869f4e2f93e368cbe2a8504d.s1.eu.hivemq.cloud';
const optionMQTT = {
    port: 8883,
    clientId: 'nodejs_client_' + Math.random().toString(16).substr(2, 8),
    username: 'trung',
    password: '123456789aA',
    rejectUnauthorized: false  // bỏ kiểm tra TLS certificate (tương tự setInsecure trên ESP32)
};
const client = mqtt.connect(brokerUrl,optionMQTT);

const app = express();
const port = 3001;
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
app.use(cors());
app.use(express.json()); // middleware đọc JSON từ client
const db = require('./database');  // import module database.js
const server = http.createServer(app);
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Data Sensor API",
      version: "1.0.0",
      description: "API quản lý và lấy dữ liệu cảm biến",
    },
    servers: [
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./openapi/*.yaml"], // nơi chứa comment JSDoc để swagger-jsdoc quét
};
const swaggerSpec = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // React chạy ở đây
    methods: ['GET', 'POST'],
  },
});

io.on('connection', async (socket) => {

  setInterval(async () => {
    const data = await db.getLatestDataSensor();
    io.emit('data_sensor', data);
  }, 3000);
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});


//sub to topic
const topicDataSensor = 'data/sensor'
const topicACtionHistory = 'device/history'
client.on('connect', () => {
  console.log('Đã kết nối MQTT broker');
  client.subscribe(topicDataSensor, (err) => {
    if (err) {
      console.log('Lỗi khi sub vào topic ' + topicDataSensor);
    } else {
      console.log("Thành công sub vào topic " + topicDataSensor)
    }
  });
  client.subscribe(topicACtionHistory, (err) => {
    if (err) {
      console.log('Lỗi khi sub vào topic ' + topicACtionHistory);
    } else {
      console.log("Thành công sub vào topic " + topicACtionHistory)
    }
  });
});


client.on('message', async (topic, message) => {
  if (topic === "data/sensor") {
    try {
      const data = JSON.parse(message.toString()); // Chuyển buffer -> string -> JSON
      // console.log("Dữ liệu JSON nhận được:", data);
      // const insertId = await db.saveDataSensor(data);
      // if (insertId) {
      //   console.log("Đã lưu bản ghi vào data sensor id " + insertId);
      // }
      // Truy cập dữ liệu
      // io.emit('mqtt_message', data);
    } catch (err) {
      console.error("Lỗi khi parse JSON:", err.message);
    }
  } else if (topic === "device/history") {
    const data = JSON.parse(message.toString());
    console.log("Dữ liệu JSON nhận được:", data);
    const insertId = await db.saveActionHistory(data);
    if (insertId) {
      console.log("Đã lưu bản ghi vào action history id " + insertId);
    }


  }
});

app.get('/', (req, res) => {
  res.send('Hello from Node.js backend! can u hre');
});


//bật tắt thiết bị
app.post('/pub-data-device', (req, res) => {
  const data = req.body;
  client.publish('device', JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("thành cồng");
    }
  });
  res.send(`thành công pub data đến topic device:${data.device}, status:${data.status}`);
});


//data-sensor đếm tổng các bản ghi
// app.get("/number-data-sensor", async (req, res) => {
//   try {
//     const data = await db.getNumberDataSensor();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.get("/latest-data-sensor", async (req, res) => {
  try {
    const data = await db.getLatestDataSensor();
    //lấy 9 dữ liệu cảm biến mới nhất
    io.emit('data_sensor', data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//lấy dữ liệu data-sensor
app.get("/data-sensor", async (req, res) => {
  const { page, sizePage, searchBy, searchValue, sortBy, statusSortBy } = req.query;
  console.log(req.query);
  try {
    const dataSensor = await db.getDataSensor(page, sizePage, searchBy, searchValue, sortBy, statusSortBy);
    res.json(dataSensor);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//action-history
//đếm tổng các bản ghi
app.get("/action-history", async (req, res) => {
  const { page, sizePage, device, action, datetime, sortBy, statusSortBy } = req.query;
  try {
    const actionHistory = await db.getActionHistory(page, sizePage, device, action, datetime, sortBy, statusSortBy);
    res.json(actionHistory);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});