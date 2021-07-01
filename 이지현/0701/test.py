
import walking
global walkingdetect
global a
global count
global data
data=[1,2,3,4,5,6,7,8,9,10]
count=0
walkingdetect=walking()
a=walkingdetect.walking(1,count)

num=0


while 1:

    num+=1
    a=walkingdetect.walking(data[num],count)
    print()
    if (num==10):
        break