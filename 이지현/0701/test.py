import walking

global a
global data
data=[1,2,3,4,5,6,7,8,9,10]



num=0


while 1:

    num+=1
    walkingdetect = walking()
    a=walkingdetect.walking(data[num])
    if a>0:
        a=a+1
        print(a)

    if (num==10):
        break