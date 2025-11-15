#include <Wire.h>

#define TRIG_PIN 9
#define ECHO_PIN 10
#define LED_GREEN 8
#define LED_RED 7

// the setup routine runs once when you press reset:
void setup()
{
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
}

long readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  long distance = duration * 0.034 / 2; // cm
  return distance;
}

// the loop routine runs over and over again forever:
void loop()
{
  // node js에서 보낸 값
  int incomingValue = 0;

  if (Serial.available() > 0)
  { // 뭔가 입력값이 있다면
    incomingValue = Serial.read();
    Serial.print("Received value: ");
    Serial.println(incomingValue);
  }
  
  if (incomingValue == 49)
  {                          // 값이 '1' 이면
    digitalWrite(LED_GREEN, HIGH); // LED를 켠다.
  }

  if (incomingValue == 48)
  {                         // 값이 '0' 이면
    digitalWrite(LED_GREEN, LOW); // LED를 끈다.
  }

  // 초음파 거리 읽기
  long distance = readDistanceCM();

  // 거리가 10cm 이하이면 LED 켜기
  if (distance <= 10) {
    digitalWrite(LED_RED, HIGH);
  } else {
    digitalWrite(LED_RED, LOW);
  }

  // 시리얼로 Node.js에 보내기
  Serial.print("Distance:");
  Serial.print(distance);
 

  delay(100);

}