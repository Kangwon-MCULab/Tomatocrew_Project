
class detectwalk :
    def __init__(self):
        self.arm_swing_cnt = 0
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
            print(self.uppeek - self.downpeek,'차이값')
            if(self.uppeek - self.downpeek > 30): #박찬형 기준으로 피크 투 피크가 30 이상일 때 걸을 때의 팔 흔들림으로 볼 수 있음
                print('차이값 통과')
                self.arm_swing_cnt = self.arm_swing_cnt + 1
                self.downpeek = 0
                self.uppeek = 0

        if(self.arm_swing_cnt == 8): # 빠른 걷기 측정을 위해 수치를 낮게 잡아둠 충분히 걸었을 때 뜨게 하려면 8을 더 높은 값으로 설정하면 됨
            print('걷기 중입니다.')
            self.arm_swing_cnt += 1

        self.predata = self.nowdata
        self.sign1 = self.sign2

    def get_swing_conut(self) :
        return self.arm_swing_cnt

    def reset_count(self) : 
       
        if(self.reset_walking_cnt == self.arm_swing_cnt): # reset.walking_cnt는 arm_swing_cnt와 비교하여 같으면(detecting에서 arm_swing_cnt가 증가하지 않으면, 즉 uppeek와 downpeek가 구해지지 않으면(팔에 흔들림이 없으면)) reset_cnt 증가
            self.reset_cnt += 1 #reset_cnt가 10이 되면 걸음이 끝났다고 인식 
            self.cnt_reset = 0 #걷지 않은 상태로 들어가면 cnt_reset을 0으로 초기화
        else:
            self.cnt_reset += 1 # cnt_reset은 다시 걷기 시작하면 reset_cnt를 초기화하기 위한 목적

        if(self.cnt_reset == 5):
            self.reset_cnt = 0
            self.cnt_reset = 0
            
        if(self.reset_cnt == 10): # 빠른 걷기 중단 측정을 위해 수치를 낮게 잡아둠 더 오래 가만히 있을 때 뜨게 하려면 10을 더 높은 값으로 설정하면 됨
            print("걷기 종료.")
            self.arm_swing_cnt = 0
            self.reset_cnt = 0

        self.reset_walking_cnt = self.arm_swing_cnt #걷고있냐 걷고있지 않냐를 판단하기 위해 이전 값을 reset_walking_cnt에 대입 

        print(self.reset_walking_cnt, self.arm_swing_cnt, self.reset_cnt, self.cnt_reset)