
class walking:
  
    def walking(self,data,count):
        
        if data<10 :
            count = count + 1          
        return count
        
    
    def __init__(self):
      self.count=0

    def walking(self,data):
        
        if data<10 :
            self.count += 1
        return self.count


