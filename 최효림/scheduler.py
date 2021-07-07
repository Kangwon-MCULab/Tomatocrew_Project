import datetime
import time
import os
import Get_Serial
import numpy as np

import walking
import Walking
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


def operation_1ms():
    start = time.time()

    n = 40 # 주기 / 0.00001__현재는 임의로 지정
    a = np.zeros((1,n)) #행렬 초기화
    f = open('data.txt')

    

    while 1:
        a[0].append(data[0])
        a[1].append(data[1])
        a[2].append(data[2])
        
        f.write(data[1])

        #write_ws['A'] = self.data[0]
        #write_ws['B'] = self.data[1]
        #write_ws['c'] = self.data[2]
        #write_wb.save("C:\Users\MCU\Tomatocrew_Project-2")

    


    while 1:
        data_1 = 0
        data_2 = 0
        data_3 = 0
        data_4 = 0
        #기울기
        m1 = 0
        m2 = 0
        m3 = 0
        count = 0 
        t = 5#주기
        t_4 = t/4
        t_3 = t*(3/4)

        if(start == 0):
            data_1 = data[1]
            

        if((start %t_4) == 0):
            data_2 = data[1]
            m1 = (data_2 - data_1)/t_4

        if((start % t_3) == 0):
            data_3 = data[1]
            m2 = (data_3 - data_2)/(t_3 - t_4)

        if((start%t)==0):
            data_4 = data[1]
            m3 = (data_4 - data_3)/(t - t_3)
            start = time.time()
            
        
        if(m1>0 and m2<0 and m3>0):
            count = count + 1 
            print("=======================",count,"==============================")

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
            w = walking()
            w.dataSetting(data)
            w.checkMaxMin()
            w.discriminant()

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

