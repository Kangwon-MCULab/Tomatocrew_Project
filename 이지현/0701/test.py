

class walking:
    
    def __init__(self):
      self.count=0

    def walking(self,data):
        
        if data<10 :
            self.count += 1
        return self.count




global data
global num


data=[1,2,3,4,50,6,70,80,90,10]

    

global count

num=0
count=0


while 1:

    global a
    global walkingdetect
  
    walkingdetect = walking()
    a=walkingdetect.walking(data[num])
    num+=1
    if a==1:
        count+=1
        print(count)


    if num==10:
        break
    

    