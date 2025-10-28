const express = require("express");
const mqtt = require("mqtt");
const brokerUrl = "mqtts://1b960938869f4e2f93e368cbe2a8504d.s1.eu.hivemq.cloud";
const optionMQTT = {
  port: 8883,
  clientId: "nodejs_client_" + Math.random().toString(16).substr(2, 8),
  username: "trung",
  password: "123456789aA",
  rejectUnauthorized: false, // bỏ kiểm tra TLS certificate (tương tự setInsecure trên ESP32)
};
const client = mqtt.connect(brokerUrl, optionMQTT);

const app = express();
const port = 3001;
const cors = require("cors");
const { Server } = require("socket.io");
const http = require("http");
app.use(cors());
app.use(express.json()); // middleware đọc JSON từ client
const db = require("./database"); // import module database.js
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
    origin: "http://localhost:3000", // React chạy ở đây
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  setInterval(async () => {
    const data = await db.getLatestDataSensor();
    io.emit("data_sensor", data);
  }, 3000);
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

//sub to topic
const topicDataSensor = "data/sensor";
const topicACtionHistory = "action/history";

client.on("connect", () => {
  console.log("Đã kết nối MQTT broker");
  //nhận biết esp32 đã khởi động
  client.subscribe("esp32/start", (err) => {
    if (err) {
      console.log("Lỗi khi sub vào topic  esp32/start");
    } else {
      console.log("Thành công sub vào topic esp32/start");
    }
  });
  //đăng kí vào topic data/sensor
  client.subscribe(topicDataSensor, (err) => {
    if (err) {
      console.log("Lỗi khi sub vào topic " + topicDataSensor);
    } else {
      console.log("Thành công sub vào topic " + topicDataSensor);
    }
  });
  //đăng kí vào topici action/history
  client.subscribe(topicACtionHistory, (err) => {
    if (err) {
      console.log("Lỗi khi sub vào topic " + topicACtionHistory);
    } else {
      console.log("Thành công sub vào topic " + topicACtionHistory);
    }
  });
});

//lắng nghe nhận tin nhắn từ topic
client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log(`📩 Nhận dữ liệu từ topic [${topic}]:`, data);

    let insertId;

    switch (topic) {
      case "data/sensor":
        insertId = await db.saveDataSensor(data);
        if (insertId) console.log(` Đã lưu vào data_sensor ID: ${insertId}`);
        io.emit("mqtt_message", data);
        break;

      case "action/history":
        insertId = await db.saveActionHistory(data);
        if (insertId) console.log(` Đã lưu vào action_history ID: ${insertId}`);
        //nếu không tồn tại thiết bị thì sẽ không lưu hành động
        if (data?.device && data.device !== "null") {
          io.emit("action_history", data);
          console.log(" Đã gửi socket action_history");
        }
        break;
      //bắt sự kiện esp32 cắm và cập nhập tình trạng thiết bị mới nhất
      case "esp32/start":
        console.log("tinh trang của esp32 " + data.status);
        const deviceLatest = await db.getLatestActionHistory(); // chờ lấy dữ liệu từ DB
        deviceLatest.forEach((item) => {
          item.status = item.action === "ON" ? 1 : 0;
          client.publish("device", JSON.stringify(item));
        });
        break;

      default:
        console.warn(` Không xử lý topic: ${topic}`);
    }
  } catch (err) {
    console.error("Lỗi khi parse JSON hoặc xử lý dữ liệu:", err.message);
  }
});

app.get("/", (req, res) => {
  res.send("Hello from Node.js backend! can u hre");
});

//bật tắt thiết bị
app.post("/pub-data-device", (req, res) => {
  const data = req.body;
  client.publish("device", JSON.stringify(data), (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("thành cồng");
    }
  });
  res.send(
    `thành công pub data đến topic device:${data.device}, status:${data.status}`
  );
});

//lấy dữ liệu data-sensor
app.get("/data-sensor", async (req, res) => {
  const { page, sizePage, searchBy, searchValue, sortBy, statusSortBy } =
    req.query;
  console.log(req.query);
  try {
    const dataSensor = await db.getDataSensor(
      page,
      sizePage,
      searchBy,
      searchValue,
      sortBy,
      statusSortBy
    );
    res.json(dataSensor);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/latest-data-sensor", async (req, res) => {
  try {
    const data = await db.getLatestDataSensor();
    //lấy 9 dữ liệu cảm biến mới nhất
    io.emit("data_sensor", data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//action-history
//đếm tổng các bản ghi
app.get("/action-history", async (req, res) => {
  const { page, sizePage, device, action, datetime, sortBy, statusSortBy } =
    req.query;
  try {
    const actionHistory = await db.getActionHistory(
      page,
      sizePage,
      device,
      action,
      datetime,
      sortBy,
      statusSortBy
    );
    res.json(actionHistory);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//lấy data action-history mới nhất
app.get("/latest-action-history", async (req, res) => {
  try {
    const data = await db.getLatestActionHistory();
    res.json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
