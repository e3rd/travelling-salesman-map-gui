# nejkratší cesta mezi městy
#
# 1. Start in JS -> mapa.html
# 2. Define hard coded `places`
# 3. Call start() in console
# 4. Call generate_matrix_length() and paste it to the `matrix` here
# 5. Launch
# 6. Use the output `display_route` back in the JS console to get the mapy.cz open at the shortest path
import pandas as pd
import numpy as np
from python_tsp.exact import solve_tsp_dynamic_programming, solve_tsp_brute_force
from python_tsp.heuristics import solve_tsp_local_search, solve_tsp_simulated_annealing
from collections import deque

method = solve_tsp_simulated_annealing

from matrix_data import matrix
# matrix = [ [ "", "Christchurch, Nový Zéland", "Mount Cook, Nový Zéland", "Dunedin, Nový Zéland", "Bluff, Nový Zéland", "Milford Sound, Nový Zéland", "Glacier fox, Nový Zéland", "Hokitika, Nový Zéland", "Pancake Rocks and Blowholes, Nový Zéland", "Arthurův Průsmyk, Nový Zéland", "Kaikoura, Nový Zéland", "Lake Rotoiti, Nový Zéland", "Nelson, Nový Zéland", "Takaka, Nový Zéland", "Picton, Nový Zéland" ], [ "Christchurch, Nový Zéland", 0, 336, 360, 591, 756, 412, 288, 294, 156, 181, 351, 416, 472, 337 ], [ "Mount Cook, Nový Zéland", 336, 0, 324, 471, 545, 469, 549, 555, 417, 511, 681, 746, 802, 667 ], [ "Dunedin, Nový Zéland", 360, 324, 0, 231, 407, 531, 582, 588, 449, 535, 704, 770, 826, 691 ], [ "Bluff, Nový Zéland", 591, 471, 231, 0, 301, 528, 713, 768, 680, 766, 945, 1011, 1067, 922 ], [ "Milford Sound, Nový Zéland", 756, 545, 406, 301, 0, 602, 787, 842, 837, 931, 1019, 1085, 1141, 1087 ], [ "Glacier fox, Nový Zéland", 412, 469, 531, 528, 602, 0, 185, 240, 256, 522, 417, 483, 539, 546 ], [ "Hokitika, Nový Zéland", 288, 549, 582, 713, 787, 185, 0, 116, 133, 399, 293, 359, 415, 422 ], [ "Pancake Rocks and Blowholes, Nový Zéland", 294, 555, 588, 768, 842, 240, 116, 0, 139, 364, 200, 266, 322, 329 ], [ "Arthurův Průsmyk, Nový Zéland", 156, 417, 449, 680, 837, 256, 133, 139, 0, 324, 294, 359, 415, 422 ], [ "Kaikoura, Nový Zéland", 181, 511, 535, 766, 931, 522, 399, 364, 303, 0, 231, 246, 349, 156 ], [ "Lake Rotoiti, Nový Zéland", 350, 681, 704, 946, 1019, 417, 293, 200, 294, 231, 0, 88, 161, 128 ], [ "Nelson, Nový Zéland", 416, 746, 770, 1011, 1085, 483, 359, 266, 359, 246, 88, 0, 104, 134 ], [ "Takaka, Nový Zéland", 472, 802, 826, 1067, 1141, 539, 415, 322, 415, 349, 161, 104, 0, 237 ], [ "Picton, Nový Zéland", 337, 667, 691, 922, 1087, 545, 422, 329, 422, 156, 128, 134, 237, 0 ] ]

df = pd.DataFrame(matrix)
df.columns = df.iloc[0]  # first row is header
df = df[1:]
df = df.set_index(df.columns[0])  # first column is index

# to assure the end node is the last, we need an 'aux' node
INF = 100000000000
df['END'] = INF  # aux column
df.loc[len(df)] = INF  # aux row

df.at[df.index[-2], df.columns[-1]] = 0  # end to aux
df.at[df.index[-1], df.columns[-2]] = 0  # aux to end
df.at[df.index[-1], df.columns[-1]] = 0  # aux to aux
df.at[df.index[0], df.columns[-1]] = 0  # start to aux
df.at[df.index[-1], df.columns[0]] = 0  # aux to start

nodes = list(df.columns)  # headers

# Call the solver
print("Starting the solver...")
distance_matrix = df.to_numpy()  # without pandas, we would call `np.array(matrix)`
permutation, distance = method (distance_matrix)
cities = [nodes[i] for i in permutation]

# rotate `END` to the end
d = deque((cities))
while d[-1] != "END":
    d.rotate(1)
d.pop() # remove `END``

print("display_route("+str(list(d))+")")
