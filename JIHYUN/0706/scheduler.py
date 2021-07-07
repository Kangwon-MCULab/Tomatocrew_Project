import time
import os
import Get_Serial
import numpy as np
from csvtest import csvtest
import math
 
timerCount1ms=0
global ee
ee=0
global data
serial = Get_Serial.Get_Serial()
data = [0,0,0,0,0,0]

def operation_1ms():

    pass
def operation_5ms():

    pass
def operation_10ms(count):

    pass
    #list
def operation_50ms():
    if data == []:
        pass
    else:
        svm =math.sqrt((data[3]**2)+(data[4]**2))

        print(int(data[0]),"\t",int(data[1]),"\t",int(data[2]),"\t",round(int(data[3]),2),"\t",int(data[4]),"\t",int(data[5]),"===========================",int(svm))
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
    global ee
    ee = 1 + ee
    global data
    global serial
    # if(data[0] == 0)and (data[1]==0)and(data[2]==0):
    #     pass
   # else:
    start = time.time()
    data = serial.get_data()
    if(ee == 5000):
        end=time.time()
        print(end - start)
        
    pass

class Scheduler:
    def idleRun(self):
        program_initialize()
        while 1:
            idle()

    def run(self):
        data1=[]
        data2=[]
        data3=[]
        count=0
       
        while 1:
      
            
            timerCounter()
            
            if timerCount1ms % 5 == 0:
                operation_5ms()
            if timerCount1ms % 10 == 0:              
                operation_10ms(count)
                # data1.append(data[3])
                # data2.append(data[4])
                # data3.append(data[5])
                # T=csvtest()
                # T.save(data1,data2,data3,count)

            if timerCount1ms % 50 == 0:
                operation_50ms()
            if timerCount1ms % 100 == 0:
                operation_100ms()
            if timerCount1ms % 500 == 0:
                operation_500ms()
            if timerCount1ms % 1000 == 0:
                operation_1000ms()

