//env 처리
require('dotenv').config();

const express = require('express')
const app = express()
const http = require('http').createServer(app);
const io = require('socket.io')(http); // Socket.io 추가

app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const { MongoClient } = require('mongodb')

let db
const url = `mongodb+srv://${process.env.MONGOID}:${process.env.MONGOPW}@arduion-led-connect.hv17jab.mongodb.net/`
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')
  http.listen(8080, () => {
  console.log('http://localhost:8080 에서 서버 실행 중')
})
}).catch((err)=>{
  console.log(err)
})



// arduino 설정
var SerialPort = require('serialport').SerialPort;
var serialPort = new SerialPort({
    path: 'COM6',
    baudRate : 9600,
    // defaults for Arduino serial communication
    dataBits : 8,
    parity : 'none',
    stopBits: 1,
    flowControl: false
})

// Arduino에서 받은 데이터를 저장할 변수
let lastDistance = 0;

// 아두이노 연결
serialPort.on('open', () => {
  console.log('open serial communication');
  serialPort.on('data', data => {
    const str = data.toString().trim();
    if (str.startsWith('Distance:')) {
      lastDistance = str.split(':')[1]; // 숫자만 저장
      io.emit('distance', lastDistance); // 웹으로 실시간 전송

      // 거리가 10cm 이하일 때만 저장
      if (lastDistance <= 10 && db) {
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9
        const timestampKey = kst.toISOString().replace('T', ' ').split('.')[0]; // YYYY-MM-DD HH:MM:SS
  
        const record = {};
        record[timestampKey] = lastDistance;
  
        db.collection('distance').insertOne(record)
          .then(() => console.log('DB에 가까워진 거리 저장 완료'))
          .catch(err => console.log('DB 저장 에러:', err));
    }
    }
    console.log(str);
  });
});

// 웹에서 거리값 요청 시
app.get('/distance', (req, res) => {
  return res.send(lastDistance.toString()); // 거리값 출력 
});


// arduino web
app.get('/led/:action', function (req, res) {
  var action = req.params.action || req.params;
  
    
  if (action == 'on') {
    
    serialPort.write("1", function(err) {
      if (err) {
        return console.error('Error writing to serial port: ', err.message);
      }
      console.log('Sending: 1');
      return res.send('Led light is on!');
    });
  } 
  else if (action == 'off') {
    serialPort.write("0", function(err) {
      if (err) {
        return console.error('Error writing to serial port: ', err.message);
      }
      console.log('Sending: 0');
      res.send('Led light is off!');
    });
  }
  else {
    return res.send('Action: ' + action);
  }

});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})


// 관리자 페이지 - 거리 기록 확인
app.get('/admin', async (req, res) => {
  try {
    if (!db) return res.send('DB 연결 안됨');

    // distance 컬렉션에서 최근 50개 기록 조회 (내림차순)
    const records = await db.collection('distance')
      .find()
      .sort({ _id: -1 })
      .limit(50)
      .toArray();

    // ejs로 렌더
    res.render('admin.ejs', { records });
  } catch (err) {
    console.log(err);
    res.status(500).send('관리자 페이지 오류');
  }
});