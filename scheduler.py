import time
import os
import Get_Serial
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation

 
timerCount1ms=0
data = []
serial = Get_Serial.Get_Serial()


def operation_1ms():

    pass
def operation_5ms():

    pass
def operation_10ms():
    
    pass
    #list
def operation_50ms():
    if data == []:
        pass
    else:
        print(int(data[0]),"\t",int(data[1]),"\t",int(data[2]))

    pass
    #list
def operation_100ms():

    pass
    #list
def operation_500ms():
    pass

    #list  
def operation_1000ms():

    pass
    #list

def program_initialize():
    global serial
    serial.SendCommand('START')

def timerCounter():
    global timerCount1ms
    if timerCount1ms == 1000:
        timerCount1ms = 0
    timerCount1ms+=1
    operation_1ms()
    time.sleep(0.001)

def idle():
    global data
    global serial
    data = serial.get_data()
    pass

class Scheduler:

    def idleRun(self):
        program_initialize()
        while 1:
            idle()

    def run(self):
        global x1
        global x2
        global x3
        global y1
        global y2
        global y3
        global figure
        global ax
        global line
        global line2
        global line3
        global ani
        global ani2
        global ani3
        def func_animate(i):
            x1 = np.linspace(0, time.time(), 100)
            if data == []:
                y1 = 0
            else:
                y1 = data[0]
            line.set_data(x1, y1)
            return line,

        def func_animate1(i):
            x2 = np.linspace(0, time.time(), 100)
            if data == []:
                y2 = 0
            else:
                y2 = data[1]
            
            line2.set_data(x2, y2)
            
            return line2,

        def func_animate2(i):
            x3 = np.linspace(0, time.time(), 100)
            if data == []:
                y3 = 0
            else:
                y3 = data[2]
            
            line3.set_data(x3, y3)
            
            return line3,
        
        x1 = []
        y1 = []
        x2 = []
        y2 = []
        x3 = []
        y3 = []
        figure, ax = plt.subplots(figsize=(6,2))
        line, = ax.plot(x1, y1)
        line2, = ax.plot(x2, y2)
        line3, = ax.plot(x3, y3)
        plt.axis([0, 100, -100, 100])
        ani = FuncAnimation(figure, func_animate, frames=10, interval=50)
        ani2 = FuncAnimation(figure, func_animate1, frames=10, interval=50)
        ani3 = FuncAnimation(figure, func_animate2, frames=10, interval=50)
        plt.show()
        while 1:
            timerCounter()
            if timerCount1ms % 5 == 0:
                operation_5ms()
            if timerCount1ms % 10 == 0:
                operation_10ms()
            if timerCount1ms % 50 == 0:
                operation_50ms()
            if timerCount1ms % 100 == 0:
                operation_100ms()
            if timerCount1ms % 500 == 0:
                operation_500ms()
            if timerCount1ms % 1000 == 0:
                operation_1000ms()


