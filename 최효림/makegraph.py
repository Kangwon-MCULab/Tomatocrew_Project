import matplotlib.pyplot as plt
import numpy as np

gra_source = np.loadtxt("C:\\Users\\HyoRimChoi\\Tomatocrew_Project\\최효림\\주기를 구해볼게.txt",delimiter = " ",dtype = np.str)

time = gra_source[:, 0]
amplitude = gra_source[:, 1]

plt.figure(num=1,dpi=100, facecolor='white')
plt.plot(time,amplitude,color = "blue", linewideth = 0.5)

plt.title('걷기 그래프')
plt.xlabel('time(now)')
plt.ylabel('amplitude')
plt.xlim(0,3)
plt.ylim(-1,1)

plt.show()