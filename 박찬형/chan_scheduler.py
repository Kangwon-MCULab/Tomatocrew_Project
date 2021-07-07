import time
import os
import chan_Get_Serial
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation
import keyboard
import walk
import datetime
import pandas as pd
 
timerCount1ms=0
data = [0,0,0]
serial = chan_Get_Serial.Get_Serial()
walking = walk.detectwalk()
flag_a = False
datalist = []

def operation_1ms():

    pass
def operation_5ms():
    time_now = str(datetime.datetime.now().time())
    
    write_data = [time_now,str(data[0]),str(data[1]),str(data[2])]
    datalist.append(write_data)
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
    print(walking.get_conut())
    walking.reset_count()
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
            if keyboard.is_pressed('f'):
                dataframe = pd.DataFrame(datalist,columns = ["time","pitch","roll","yaw"])
                dataframe.to_csv("data.csv",index = False)
                


