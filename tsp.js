function* generatePermutations(arr, start = 0) {
  if (start === arr.length - 1) {
    yield [...arr]
    return
  }

  for (let i = start; i < arr.length; i++) {
    [arr[start], arr[i]] = [arr[i], arr[start]]
    yield* generatePermutations(arr, start + 1);  // ; needed
    [arr[start], arr[i]] = [arr[i], arr[start]]
  }
}

/**
 * Naive brute-force approach. First and last node are stable,
 * we do not alter start and finish points of the travelling salesman.
 * @param {number[][]} matrix
 * @returns
 */
function TSP(matrix) {
  let shortestDistance = Infinity
  let shortestPath = []

  const keys = Object.keys(matrix)
  const [start, finish, permutable] = [keys[0], keys.pop(), keys.slice(1)] // do not permute start and finish
  for (const permutation_ of generatePermutations(permutable)) {
    const permutation = [start, ...permutation_, finish]
    let distance = 0
    let stop = false
    for (let i = 0; i < permutation.length - 1; i++) {
      distance += matrix[permutation[i]][permutation[i + 1]]
      if (distance >= shortestDistance) {
        stop = true
        break
      }
    }
    if (stop) {
      continue
    }
    shortestPath = permutation
    shortestDistance = distance
  }
  return shortestPath
}
