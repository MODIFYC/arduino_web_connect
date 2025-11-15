const socket = io(); // Socket.io 클라이언트 연결

const distanceEl = document.getElementById('distanceValue');

socket.on('distance', value => {
  distanceEl.innerText = value + ' cm'; // 실시간 업데이트
});

