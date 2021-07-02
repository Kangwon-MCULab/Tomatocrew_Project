import time
import os
import Get_Serial
import numpy as np
import walking
 
timerCount1ms=0
global data
<<<<<<< HEAD
global count
count=0
=======
global  R_data
R_data=[]
>>>>>>> a661037923f5ac2dd6dd6d395d983e36162d372e
serial = Get_Serial.Get_Serial()
data = [0,0,0]

def operation_10us():
    end = time.time()

    R_data.append(data[0])
    R=np.array(R_data)
  
    np.save('R_data',R)
    data2=np.load('R_data.npy')
    if end==1:#걷기 주기 끝나는 시간
        print(data2)
        pass
    pass
def operation_1ms():

    pass
def operation_5ms():

    pass
def operation_10ms():
    
    pass
    #list
def operation_50ms():
    if data == []:
        pass
    else:
        print(int(data[0]),"\t",int(data[1]),"\t",int(data[2]))
        
    pass
    #list
def operation_100ms():

    global walkingdetect
    global a
    walkingdetect =walking.walking()
    a=walkingdetect.walking(data[1],count) 
    print(int(a))

    pass
    #list
def operation_500ms():
    pass

    #list  
def operation_1000ms():

    pass
    #list

def program_initialize():
    global serial
    serial.SendCommand('START')

def timerCounter():
    global timerCount1ms
    if timerCount1ms == 1000:
        timerCount1ms = 0
    timerCount1ms+=1
    operation_1ms()
    time.sleep(0.001)

def idle():
    global data
    global serial
    data = serial.get_data()
    pass

class Scheduler:
    def idleRun(self):
        program_initialize()
        while 1:
            idle()

    def run(self):
        while 1:
            timerCounter()
            if timerCount1ms % 0.001 == 0:
                operation_10us()
            if timerCount1ms % 5 == 0:
                operation_5ms()
            if timerCount1ms % 10 == 0:
                operation_10ms()
            if timerCount1ms % 50 == 0:
                operation_50ms()
            if timerCount1ms % 100 == 0:
                operation_100ms()
            if timerCount1ms % 500 == 0:
                operation_500ms()
            if timerCount1ms % 1000 == 0:
                operation_1000ms()

