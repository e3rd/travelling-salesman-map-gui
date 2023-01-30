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
# matrix = [ [ "", "Christchurch, Nový Zéland", "Mount Cook, Nový Zéland", "Dunedin, Nový Zéland" ], [ "Christchurch, Nový Zéland", 0, 336, 360 ], [ "Mount Cook, Nový Zéland", 336, 0, 324 ], [ "Dunedin, Nový Zéland", 360, 324, 0 ] ]

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
