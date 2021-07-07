from matplotlib import pyplot
from matplotlib.animation import FuncAnimation
import chan_scheduler

def start() :
    figure = pyplot.figure(figsize=(15,5))
    global index1
    global index2
    global index3
    index1 = 0
    index2 = 0
    index3 = 0
    x_data, y_data = [0], [0]
    x_data2, y_data2 = [0], [0]
    x_data3, y_data3 = [0], [0]
    line, = pyplot.plot(x_data, y_data,'r-')
    line2, = pyplot.plot(x_data2, y_data2,'b-')
    line3, = pyplot.plot(x_data3, y_data3,'g-')

    def update(frame):
        global index1
        index1 = index1+1
        check = index1
        x_data.append(check)
        y_data.append(chan_scheduler.data[0])

        line.set_data(x_data[-20:], y_data[-20:])
        figure.gca().relim()
        figure.gca().autoscale_view()
        return line,

    def update2(frame):
        global index2
        index2 = index2+1
        check = index2
        
        x_data2.append(check)
        y_data2.append(chan_scheduler.data[1])
        
        line2.set_data(x_data2[-20:], y_data2[-20:])
        figure.gca().relim()
        figure.gca().autoscale_view()
        return line2,

    def update3(frame):
        global index3
        index3 = index3+1
        check = index3
        
        x_data3.append(check)
        y_data3.append(chan_scheduler.data[2])
        
        line3.set_data(x_data3[-20:], y_data3[-20:])
        figure.gca().relim()
        figure.gca().autoscale_view()
        return line3,

    animation3 = FuncAnimation(figure, update3, interval=50)
    animation = FuncAnimation(figure, update, interval=50)
    animation2 = FuncAnimation(figure, update2, interval=50)

    pyplot.show()