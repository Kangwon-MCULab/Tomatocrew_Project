import time
import os
import Get_Serial
import numpy as np
import walking
import pandas as pd
 
timerCount1ms=0
global data
<<<<<<< HEAD

global count
count=0

global  R_data
R_data=[]

=======
count =0
global  R_data
R_data=[]
global T_data
T_data=[]
>>>>>>> 38549db08cb789baab51b4797bc80589bcf2b754
serial = Get_Serial.Get_Serial()
data = [0,0,0]
'''
def operation_10us():

<<<<<<< HEAD
    R_data.append(data[1])
    R=np.array(R_data)
=======
    # R_data.append(int(data[0]))
    # R=np.array(R_data)
>>>>>>> 38549db08cb789baab51b4797bc80589bcf2b754
  
    # np.save('R_data',R)
    # data2=np.load('R_data.npy')
    # count+=1
    # #if count==10:#걷기 주기 끝나는 시간
    # print(count)
    # print(data)
        
    pass
'''
def operation_1ms():

    pass
def operation_5ms():

    pass
def operation_10ms():
    if(data[0] == 0 and data[1] == 1 and data[2] == 0):
        pass
    else:
        R_data.append(data[1])
        now = time.time()
        print(int(data[1]),"==========",now - start)
        R=np.array(R_data)
    
        np.save('R_data',R)
    

    
   
    
    if data ==[0,0,0]:
        pass
    else :
        # t = 5#주기
        # t_4 = t/4
        # t_3 = t*(3/4)
        R_data.append(int(data[1]))
        R=np.array(R_data)
 
       
        

        np.savetxt('R_data.txt',R)
      
        data2=np.loadtxt('R_data.txt')
       
        now  =time.time()
        print(int(data[1]),"\t",now-start)
       

        # if(start == 0.15) :
        #     data_1 = data[1]
            

        # if(start == 0.25):
        #     data_2 =data[1]
        #     m1 = (data_2 - data_1)/0.1
        #     print(m1)

       

        # def walking(self,m1,m2):
        #     self.count==0
        
        # if(m1>0 and m2<0 and m3>0):
            
        #     self.count += 1
                
        # return self.count
        
            # global a
            # global walkingdetect
  
            # walkingdetect = walking()
            # a=walkingdetect.walking(m1)
            # num+=1
            # if a==1:
            # count+=1
            # print(count)

    pass
    #list
def operation_50ms():
    # if data == []:
    #     pass
    # else:
    #    # print(int(data[0]),"\t",int(data[1]),"\t",int(data[2]))
        
    pass
    #list
def operation_100ms():

    pass
    #list
def operation_500ms():
    pass

    #list  
def operation_1000ms(count):
    # if time.time()>0:
    #     count+=1
    #     print(count)

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
<<<<<<< HEAD
        global start
        start = time.time()

=======
        start = time.time()
        count = 0
>>>>>>> 38549db08cb789baab51b4797bc80589bcf2b754
        while 1:
            
            timerCounter()
<<<<<<< HEAD
            '''
            if timerCount1ms % 0.001 == 0:
                operation_10us()
            '''
=======
           
>>>>>>> 38549db08cb789baab51b4797bc80589bcf2b754
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
                operation_1000ms(count)

