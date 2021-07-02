
class detectwalk :
    def __init__(self):
        self.threshold = 18 #기준 18넘어가면 걸음이라고 치겠다 self는 java의 this와 비슷한 느낌(같은것은 아니다)
        self.walking_cont = 0

    def detecting(self,data) :
        if(data > self.threathold) :
            self.walking_cont = self.walking_cont + 1

    def get_conut(self) :
        return self.walking_cont