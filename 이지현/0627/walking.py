import scheduler

#데이터 받아오기
#몇 번 걸었는지 분석하기
#Threshold값 정하기

#데이터 받아오기
class walking:
    def __init__(self):
        self.count = 0

    def walking(self,tdata):
        
        if tdata>10 :
            self.count += 1
        return self.count

    def get_data(self):

        Roll=scheduler.data[0]
        Pitch=scheduler.data[1]
        Yaw=scheduler.data[2]

        return [Roll,Pitch,Yaw]



test=walking()
a=test.get_data()

print(test.get_data())
print(test.walking(a[2]))
