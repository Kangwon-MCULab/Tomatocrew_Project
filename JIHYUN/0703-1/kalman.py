import numpy as np

class Kalman():

    def __init__(self):
        self.P = np.matrix([[0., 0.],
                            [0., 0.]])
    def setKalmanAngle(self, angle):
        self.State = np.matrix([[angle],
                                [0.   ]])

    def getKalmanAngle(self, angle, gyro_rate, dt):
        R = 0.03
        Q = np.matrix([[0.001, 0.   ],
                       [0.,    0.003]])
        H = np.matrix( [1.,    0.   ])

        F = np.matrix([[1., -dt],
                       [0., 1. ]])
        B = np.matrix([[dt],
                       [0.]])
        
        self.State = F * self.State + B * gyro_rate

        self.P = F * self.P * np.transpose(F) + Q

        I = angle - H * self.State

        S = H * self.P * np.transpose(H) + R

        KG = self.P * np.transpose(H) / S

        self.State = self.State + KG * I

        self.P = (np.eye(2) - KG * H) * self.P

        return self.State.item(0)