---
layout: post
title: "Optimization"
date: 2025-01-04 17:55:06 +0100
categories:
---

# What's optimization?

Optimization is a field in mathematics about finding the minimum values of functions. The better we're at finding minimums of functions, the more advanced are the AI systems we create.

One can argue that from optimization algorithms (famously: [gradient descent](https://en.wikipedia.org/wiki/Stochastic_gradient_descent)) sprung machine learning and artificial intelligence. But optimization is also a thing in itself.

In the real world, there are many occasions where you need to find the _optimal solution_ to some function:

- economics and finance (planification and resource allocation)
- transportation (finding the best route for a truck delivering packages)
- manufacturing and chemistry (line of productions)
- rigid body dynamics (making robots move)
- ...

There are dozens of recurring optimization problems. To describe and solve them, you use [solvers](https://en.wikipedia.org/wiki/List_of_optimization_software), like [Gurobi](https://www.gurobi.com) or [PyOmo](http://www.pyomo.org).

{% include video.html src="/assets/traveling_salesman.mp4" %}

_An example of an optimisation problem, the [travelling salesman](https://en.wikipedia.org/wiki/Travelling_salesman_problem), being solved with the CP-SAT solver._

# My story with optimization

## Electrification of vehicle fleets

In 2023, I worked on a project about finding the optimal number of electric chargers to buy as a fleet operator progressively transitions to electric vehicles.

As time goes by, the vehicle operator replaces their oldest vehicles by new electric vehicles, that are expected to become evermore efficient and powerful. However, many operational questions arise.

- Should the fleet operator invest early in powerful, yet expensive chargers? If so, when?
- How to allocate those between electric vehicles that come and go at different time of the day?
- What about [surge pricing](https://www.gridx.ai/knowledge/dynamic-electricity-pricing) and [electrical grid](https://en.wikipedia.org/wiki/Electrical_grid) limitations?

During my studies at Télécom Paris, I had optimization classes. I quickly recognized some of these questions as relevant to the [newsvendor model](https://en.wikipedia.org/wiki/Newsvendor_model) and [job-shop scheduling](https://en.wikipedia.org/wiki/Job-shop_scheduling). Those were standard [Linear Programming](https://en.wikipedia.org/wiki/Linear_programming) problems so I was not too worried.

I quickly spun up [the Python module Pulp](https://coin-or.github.io/pulp/) and started modelling. But as business requirements and questions kept piling up, formulating the problem got harder and harder. And ultimately, something didn't add up.

You see, Pulp is an awesome framework for _linear and mixed integer programming_, which means solving linear problems with whole numbers. The issue was that I couldn't formulate the requirements as linear, despite countless mathematical tricks.

Looking for something like _non-linear solvers_, I found OR Tools and CP-SAT.

## OR Tools and CP-SAT

[Google OR Tools](https://developers.google.com/optimization/install) is an open source framework to describe and solve several optimization problems. The most powerful solver available is called CP-SAT, whose name is a combination of CP _**C**onstrained **P**rogramming_ and _Boolean **Sat**isfaction Problems_.

### The magic

OR Tools greatly simplifies the definition of several problems. For example, the traveling salesman, which is about finding the route of a salesman accross multiple cities, such that the total distance is minimal.

In Pulp, forget about it: this is not a linear problem.

In OR Tools? Well, obviously, you simply import a `RoutingManager`, define the distance between each city, and... you know. Call `routing.SolveWithParameters(search_parameters)`.

```python
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

data = ... # Skipping the definition of data

# Create the routing index manager
manager = pywrapcp.RoutingIndexManager(
    len(data["distance_matrix"]), data["num_vehicles"], data["depot"]
)

# Create Routing Model
routing = pywrapcp.RoutingModel(manager)

# distance_callback is a function that returns the distance between two cities
transit_callback_index = routing.RegisterTransitCallback(distance_callback)

# Define the distance between two cities
routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

# Set first solution heuristic
search_parameters = pywrapcp.DefaultRoutingSearchParameters()
search_parameters.first_solution_strategy = (
    routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
)

# Solve the problem (just do it.)
solution = routing.SolveWithParameters(search_parameters)
```

_Full code [here](https://developers.google.com/optimization/routing/tsp#complete_programs). Try [a demo here](https://cpsat-embeddings-demo.streamlit.app)._

This level of abstraction is insane. Moreover, the framework lets you define more complex problems with multiple salesmen travelling, with additional constraints regarding the cities order or material they need to pickup. This is especially useful for logistics and construction.

### Electric vehicles

In my case, I wanted to create a model where you could split an electric charger between multiple vehicles, which is a constraint such that $$z = x * y$$. However, this makes the problem no longer linear, and doesn't work with Pulp.

For example, let's pretend we're looking for $$x$$ and $$y$$ such that $$1 < x < 10$$, $$30 < y < 100$$ and $$xy = 99$$

If you try to do this, Pulp will crash.

```python
from pulp import LpProblem, LpVariable, LpMinimize, LpStatus, value

model = LpProblem("Multiplication", LpMinimize)
x = LpVariable("x", lowBound=1, upBound=10, cat='Integer')
y = LpVariable("y", lowBound=30, upBound=100, cat='Integer')
result = LpVariable("result", lowBound=0, upBound=100*100, cat='Integer')

model += (result == 99, "Set_result")

# Add a constraint to set result equal to x * y. This will crash! Pulp doesn't support this.
model += (result == x * y, "Set_result")
```

OR Tools, however, won't bat an eye.

```python
from ortools.sat.python import cp_model

model = cp_model.CpModel()
x = model.NewIntVar(1, 10, "x")
y = model.NewIntVar(30, 100, "y")
result = model.NewIntVar(0, 100 * 100, "result")

model.Add(result==99)
# This is how you add a constraint to set the result = x * y.
model.AddMultiplicationEquality(result, [x, y])

# Solve
solver = cp_model.CpSolver()
status = solver.Solve(model)

print(f"x: {solver.Value(x)}, y: {solver.Value(y)}, Solution is: {solver.Value(result)}")
```

Which yields either

```text
x: 3, y: 33, Solution is: 99
```

Or

```text
x: 1, y: 99, Solution is: 99
```

When I saw this, my mind was blown, and OR Tools became my favorite tool for modelling insane problems.

### What's the difference between CP-SAT and Linear Programming?

In Linear Programming, the goal is to describe your function as a linear one, aka a matrix $$A$$. Then, you're looking for the vector $$x$$ that minimizes $$Ax$$ according to some constraints. The easiest way to solve the problem is to perform operations on rows of $$A$$, as if you were solving a linear system.

By contrast, SAT is a different world. The problem is reframed as solving boolean expressions, such as `(X and Y) or (X and (not Z))`. This is done by exploring a graph of those clauses.

From what I understand, CP-SAT combines those two approaches with tons of heuristics to solve very diverse problems, very efficiently. A cost of this approach is that CP-SAT doesn't support decimal numbers, for example.

I won't lie, learning material around CP-SAT is quite scarce and not as welcoming as other modules.

- If you're a search expert, you may find value in the talk [Search is Dead, Long Live Proof](https://people.eng.unimelb.edu.au/pstuckey/PPDP2013.pdf).
- If you're starting out, [the CP SAT primer](https://d-krupke.github.io/cpsat-primer/07_under_the_hood.html) by Dominik Krupke is a great place to start. And I wish it existed when I started working on this EV project!
- If you're looking for tips and tricks, I created [a repository with multiple notebooks](https://github.com/oulianov/cp-sat-fun) exposing various tricks I used during my EV project - some undcoumented.

But the all-knowning, infinite, omniscient source of knowledge around CP-SAT is no one than [Laurent Perron](https://www.linkedin.com/in/laurentperron/?originalSubdomain=fr), the author of CP-SAT, OR Tools, and current Google tech lead of operations Research. If you're searching for questions online about OR tools, he's likely to be the one directly answering. On [the OR Tools Discord](https://discord.gg/ENkQrdf), he's extremly reactive and always super sharp.

And I must say I feel very honored that Laurent Perron himself [opened an issue on my github repo](https://github.com/oulianov/cp-sat-fun/issues/1) to pinpoint a rookie mistake I made 🙏 (and he also complimented one of my notebooks 🙏🙏🙏)
