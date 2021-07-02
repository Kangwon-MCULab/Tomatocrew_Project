import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

x = []
y = []

figure, ax = plt.subplots(figsize=(4,3))
line, = ax.plot(x,y)
plt.axis([0, 50,-1,1]) #x축 y축

def func_animate(i):
    x=np.linspace(0,1,50)
    y=np.random.rand(50)
    #np.random.randn(50) 

    line.set_data(x,y)

    return line,


ani = FuncAnimation(figure,func_animate,frames=10,interval=50)

ani.save(r'animation.gif',fps=10)

plt.show()