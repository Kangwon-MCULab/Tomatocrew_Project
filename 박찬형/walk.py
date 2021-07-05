
class detectwalk :
    def __init__(self):
        self.threshold = 30 #기준 18넘어가면 걸음이라고 치겠다 self는 java의 this와 비슷한 느낌(같은것은 아니다)
        self.walking_cont = 0
        self.nowdata = 0
        self.predata = 0
        self.uppeek = 0
        self.downpeek = 0
        self.sign1 = 0
        self.sign2 = 0
        self.reset_cnt = 0
        self.reset_walking_cnt = 0

    def detecting(self,data) :
        self.nowdata = int(data)

        if((self.nowdata - self.predata) > 0):
            self.sign2 = 1

        if((self.nowdata - self.predata) < 0):
            self.sign2 = 2

        if(self.sign2 == 1)and(self.sign1 == 2):
            self.downpeek = self.predata

        if(self.sign2 == 2)and(self.sign1 == 1):
            self.uppeek = self.predata

        if(self.downpeek != 0)and(self.uppeek != 0):
            if(self.uppeek - self.downpeek > 0):
                self.walking_cont = self.walking_cont + 1
                self.downpeek = 0
                self.uppeek = 0
        
        self.predata = self.nowdata
        self.sign1 = self.sign2

    def get_conut(self) :
        return self.walking_cont

    def reset_count(self) :
        if(self.reset_walking_cnt == self.walking_cont):
            self.reset_cnt += 1
        if(self.reset_cnt == 10):
            self.walking_cont = 0
            self.reset_cnt = 0
        self.reset_walking_cnt = self.walking_cnt