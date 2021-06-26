import time
import os
import Get_Serial


 
 
timerCount1ms=0
data = []
serial = Get_Serial.Get_Serial()

def operation_1ms():

    pass
def operation_5ms():

    pass
def operation_10ms():
    if data == []:
        pass
    else:
        print(int(data[0]),int(data[1]),int(data[2])) # yaw pitch roll
    pass
    #list
def operation_50ms():

    pass
    #list
def operation_100ms():

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
        while 1:
            idle()


    def run(self):
        program_initialize()
        while 1:
            timerCounter()
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