import numpy as np

class sit():
    
    def __init__(self):
        self.n = 40
        self.data_s = ([])
        self.sitnum = 0

        self.count = 0

    def dataSetting(self,data):
        print("들어옴")
        
        self.data_s= np.append(self.data_s,data[4])
        return



    def think(self):
        print("enter")
        for i in range(0,len(self.data_s)-1):
            if((self.data_s[i]- self.data_s[i+1]) >= 200000):
                self.count = self.count + 1 
                if(self.count%2 == 0):
                    self.sitnum = self.count/2
                    print("===============================================",self.sitnum ,"번 앉았다 일어났습니다.")
                
        self.data_s = np.array([])
        return