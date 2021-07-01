import matplotlib.pyplot as plt
import numpy as np

flg2 = plt.figure()      # 차트 플롯 생성
chart = flg2.add_subplot(1, 1, 1)    # 행, 열, 위치

# data 생성
data1 = np.random.randn(50)                 # 난수
data2 = np.random.randn(50).cumsum()    # 난수 -> 누적 합

# 선 스타일 차트
chart.plot(data2, label='line', color='g')
plt.title("multi chart draw")      # 차트 제목
plt.xlabel('stage')                 # x축 
plt.ylabel('random number')    # y축
plt.legend(loc='best')  
          # 범례
plt.show()