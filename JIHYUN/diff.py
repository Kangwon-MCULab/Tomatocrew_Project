import datetime
count=0
dt1=datetime.datetime.now()

while 1 :
    count+=1
    print(dt1)
    
    if count==10 :
        dt2=datetime.datetime.now()
        print(count,dt2)
        break
