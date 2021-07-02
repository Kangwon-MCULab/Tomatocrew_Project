import numpy as np
import time
from openpyxl import Workbook

class Walking():
    start = time.time()

def __init__(self,data):
    self.data = data

def datamanage(self):
    '''openpyxl 모듈 설치'''
    n = 40 # 주기 / 0.00001__현재는 임의로 지정
    a = np.zeros((3,n)) #행렬 초기화
    #f = open('C:\Users\geovision\.vscode\Tomatocrew_Project\최효림\data.txt')

    write_wb = Workbook()

    write_ws = write_wb.active

    while 1:
        a[0].append(self.data[0])
        a[1].append(self.data[1])
        a[2].append(self.data[2])
        #f.write(self.data[1])

        write_ws['A'] = self.data[0]
        write_ws['B'] = self.data[1]
        write_ws['c'] = self.data[2]
        write_wb.save("C:\Users\HyoRimChoi\.vscode\Tomatocrew_Project\최효림\dataSave.cell")

    

def datadiscriminate(self):
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
            count = count + 1 
            print("=======================",count,"==============================")
