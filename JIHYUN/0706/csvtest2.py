from csvtest import csvtest



count=0
test=0
data1=[]
data2=[]
data3=[]


#f= open('tesst.csv','w',newline='')


while 1:
    

    data1.append(test)
    data2.append(test)
    data3.append(test)
    test+=2
    
    
    
    
    
    
    if test==20:
        break

while 1:
    
   
    T=csvtest()
    T.save(data1,data2,data3,count)

    count+=1
    
    if count==10:
        break

