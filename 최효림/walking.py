import numpy as np
import time


class walking():
    t = 1.2
    n = t/0.00001
    MAX = 0
    MIN = 0
    m = [0,0,0]
    count = 0
    data_w = np.zeros(1,n)

    def dataSetting(self,data):
        
        self.data_w.append(data[1])
        
    def checkMaxMin(self):
        for i in self.data_w:
            if( i < i+1):
                self.MAX = i+1
                self.MIN = i

        self.data_w = np.zeros(1,self.n)

    def discriminant(self):
        if(self.data_w[0]<self.MAX  and  self.MAX>self.MIN  and  self.data_w[39]> self.MIN):
            self.count = self.count + 1
            print("=====================================",self.count)