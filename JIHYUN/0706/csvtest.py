import csv




class csvtest():
    def __init__(self):

        self.f= open('지현0706-1.csv','w',newline='')

    def save(self,R,P,Y,count) :
    
        data1=[]
        data2=[]
        data3=[]
      


    
        data1.append(R)
        data2.append(P)
        data3.append(Y)


        wr = csv.writer(self.f)
    

         
        wr.writerow(['ax',data1])
        wr.writerow(['ay',data2])
        wr.writerow(['az',data3])
   





