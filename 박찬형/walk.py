
class detectwalk :
    def __init__(self):
        self.threshold = 30 
        self.walking_cont = 0
        self.nowdata = 0
        self.predata = 0
        self.uppeek = 0
        self.downpeek = 0
        self.sign1 = 0
        self.sign2 = 0
        self.reset_cnt = 0
        self.reset_walking_cnt = 0
        self.cnt_reset = 0

    def detecting(self,data) :
        self.nowdata = int(data)

        if((self.nowdata - self.predata) > 0):
            self.sign2 = '+'

        if((self.nowdata - self.predata) < 0):
            self.sign2 = '-'

        if(self.sign2 == '+')and(self.sign1 == '-'):
            self.downpeek = self.predata

        if(self.sign2 == '-')and(self.sign1 == '+'):
            self.uppeek = self.predata

        if(self.downpeek != 0)and(self.uppeek != 0):
            if(self.uppeek - self.downpeek > 18):
                self.walking_cont = self.walking_cont + 1
                self.downpeek = 0
                self.uppeek = 0
        
        self.predata = self.nowdata
        self.sign1 = self.sign2

    def get_conut(self) :
        return self.walking_cont

    def reset_count(self) : 
        if(self.reset_walking_cnt == self.walking_cont): # reset.walking_cnt는 walking_cont와 비교하여 같으면(detecting에서 walking_cont가 증가하지 않으면, 즉 uppeek와 downpeek가 구해지지 않으면(팔에 흔들림이 없으면)) reset_cnt 증가
            self.reset_cnt += 1 #reset_cnt가 10이 되면 걸음이 끝났다고 인식 
            self.cnt_reset = 0 #걷지 않은 상태로 들어가면 cnt_reset을 0으로 초기화
        else:
            self.cnt_reset += 1 # cnt_reset은 다시 걷기 시작하면 reset_cnt를 초기화하기 위한 목적

        if(self.cnt_reset == 5):
            self.reset_cnt = 0
            self.cnt_reset = 0
            
        if(self.reset_cnt == 10):
            print("걷기 종료.")
            self.walking_cont = 0
            self.reset_cnt = 0

        self.reset_walking_cnt = self.walking_cont #걷고있냐 걷고있지 않냐를 판단하기 위해 이전 값을 reset_walking_cnt에 대입 

        print(self.reset_walking_cnt, self.walking_cont, self.reset_cnt, self.cnt_reset)