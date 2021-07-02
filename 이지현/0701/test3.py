import numpy as np
global num
num=0
a=[]


while 1: 
    a.append(num)
    num+=1
    z=np.array(a)
    np.save('z_data',z)
    data2=np.load('z_data.npy')
    
  
    
    if num==9:
        aa=np.array(a).reshape((1,3,3)) 
        print(data2)
        print(aa)
        

        break

# np.save('z_data',z)
# data2=np.load('z_data.npy')
# print(data2)