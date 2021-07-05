import numpy as np
import time
start = time.time()

def __init__(self,data):
    self.data = data
    
def datamanage():
    n = 40 # 주기 / 0.00001__현재는 임의로 지정
    a = np.zeros((1,n)) #행렬 초기화
    f = open('data.txt')

    while 1:
        a.append(self.data[1])
        f.write(self.data[1])


    

def datadiscriminate():
    while 1:
        data_1 = 0
        data_2 = 0
        data_3 = 0
        data_4 = 0
        m1 = 0
        m2 = 0
        m3 = 0
        count = 0 
        t = 5#주기
        t_4 = t/4
        t_3 = t*(3/4)

        if(start == 0):
            data_1 = self.data[1]
            

        if((start %t_4) == 0):
            data_2 = self.data[1]
            m1 = (data_2 - data_1)/t_4

        if((start % t_3) == 0):
            data_3 = self.data[1]
            m2 = (data_3 - data_2)/(t_3 - t_4)

        if((start%t)==0):
            data_4 = self.data[1]
            m3 = (data_4 - data_3)/(t - t_3)
            start = time.time()
            
        
        if(m1>0 and m2<0 and m3>0):



def walking(self,m1,m2,m3):
    self.count==0
        
        if(m1>0 and m2<0 and m3>0):
            
            self.count += 1
                
        return self.count
