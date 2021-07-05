import time
import os
import chan_Get_Serial
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

import walk

 
timerCount1ms=0
data = [0,0,0]
serial = chan_Get_Serial.Get_Serial()
walking = walk.detectwalk()

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
        walking.detecting(data[2])
    pass 
    #list
def operation_100ms():
    pass
    #list
def operation_500ms():
    pass 
    #list  
def operation_1000ms():
    print(walking.get_conut())
    walking.reset_count()
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
            timerCounter()   #이 아래것들은 5ms당 10ms당 50ms당 100ms당 500ms당 1000ms당 오퍼레이션 ?ms함수 소환
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


