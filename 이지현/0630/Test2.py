from matplotlib import pyplot as plt


R=50
P=50
Y=30
data=[R,P,Y]


if int(data[0])>40:
    print("까딱")
else:
    print("안정함")

plt.plot([Row,Pitch,Yaw],[110,130,120])
plt.show()
