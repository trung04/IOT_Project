
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'iot',
  waitForConnections: true,

});
const { parse, isValid } = require('date-fns');

//data sensor
//lưu dữ liệu
async function saveDataSensor(data) {
  const query = `INSERT INTO data_sensor (temperature, humidity, light) VALUES (?, ?, ?)`;
  const [result] = await pool.execute(query, [
    data.temperature,
    data.humidity,
    data.light
  ]);
  return result.insertId;

}
// dữ liệu sensor
async function getDataSensor(page = 1, sizePage = 10, q1 = null, q2 = null, sortBy = null, statusSortBy = null) {
  const offset = (page - 1) * sizePage;
  let query = "select * from (SELECT * FROM data_sensor";

  //kiểm tra q2 có phải ngày hay ko
  if (q1 === "all" && q2 != "") {
    const isNumber = !isNaN(q2);
    if (isNumber) {
      query += ` where id = ${q2}`
        + ` OR temperature = ${q2}`
        + ` OR humidity = ${q2}`
        + ` OR light = ${q2}`;

    } else {
      query += ` where created_at like '%${q2}%'`;
    }
  }
  else if (q1 != "all" && q2 != "") {
    if (q1 == "created_at") {
      query += ` where ${q1} like  '%${q2}%'`;
    } else {
      query += ` where ${q1} = ${q2}`;
    }
  }
  let query2 = query + ` ) as data`
  query += ` order by id desc LIMIT ${sizePage} OFFSET ${offset}`;
  query += ` ) as data`;
  const [totalRecord] = await pool.query(query2, [q2]);
  //sắp xếp
  query += ` order by ${sortBy}`;
  if (statusSortBy) {
    query += ` desc`;
  }
  const [row] = await pool.query(query, [q2]);
  console.log(query);
  return {
    data: row,
    totalRecord: totalRecord.length
  };
}

async function getLatestDataSensor() {
  const query = `
    SELECT * 
    FROM data_sensor
    ORDER BY created_at DESC
    LIMIT 10
  `;
  const [rows] = await pool.query(query);
  return rows;
}





//lưu dữ liệu action history
async function saveActionHistory(data) {
  if (data.device !== null && data.device !== 'null' && data.device !== "null" && typeof data.device !== 'undefined') {
    const action = data.status == 1 ? "ON" : "OFF";
    const query = `INSERT INTO action_history (device,action) VALUES (?, ?)`;
    const [result] = await pool.execute(query, [
      data.device,
      action
    ]);
    return result.insertId;
  }
}
//action history
async function getActionHistory(page = 1, sizePage = 10, q1 = null, q2 = null, sortBy = null, statusSortBy = null) {
  const offset = (page - 1) * sizePage;
  let query = "SELECT * From ( select * from action_history";
  //kiểm tra q2 có phải ngày hay ko
  if (q1 === "all" && q2 != "") {
    query += ` where device like '%${q2}%' or action like '%${q2}%' or created_at like '%${q2}%'`;
  }
  else if (q1 != "all" && q2 != "") {
    if (q1 == "created_at") {
      query += ` where ${q1} like '%${q2}%'`;
    } else {
      query += ` where ${q1} like '%${q2}%'`;
    }
  }

  let query2 = query + ` ) as data`
  query += ` order by id desc LIMIT ${sizePage} OFFSET ${offset}`;
  query += ` ) as data`;
  //sắp xếp
  query += ` order by ${sortBy}`;
  if (statusSortBy) {
    query += ` desc`;
  }
  const [totalRecord] = await pool.query(query2, [q2]);
  const [row] = await pool.query(query, [q2]);
  console.log(query);
  return {
    data: row,
    totalRecord: totalRecord.length
  };
}



module.exports = {
  pool,
  getDataSensor,
  getActionHistory,
  saveDataSensor,
  saveActionHistory,
  getLatestDataSensor
};
