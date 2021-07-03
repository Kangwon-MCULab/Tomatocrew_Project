import datetime
import time
import os
import Get_Serial
import numpy as np

 
timerCount1ms=0
global ee
ee=0
global data
serial = Get_Serial.Get_Serial()
data = [0,0,0]
global a 
a = np.zeros((1,40))
global f
f = open("주기를 구해볼게.txt",'w')


def operation_1ms():

    pass
def operation_5ms():
    global f
    now = datetime.datetime.now()
    data_temp =[]
    data_temp = str(now) + "\t"+ str(data[0]) + "\t"+ str(data[1]) + "\t"+ str(data[2])+'\n'


    f.write(data_temp)


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

