import numpy as np


x= np.array([0,1,2,3,4])

np.save('x_data.npy',x)

data2=np.load('x_data.npy')
print(data2)