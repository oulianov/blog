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

That's when I discovered [Google OR Tools](https://developers.google.com/optimization/install) and CP-SAT.

## OR Tools and CP-SAT

Coming soon

## More OR Tools

Links to more resources:

- [CP-SAT fun](https://github.com/oulianov/cp-sat-fun): A collection of notebooks with various techniques. Trivia: [Laurent Perron,](https://scholar.google.com/citations?user=umrglaIAAAAJ&hl=en) Google tech lead of Operations Research, [left a comment on the repo](https://github.com/oulianov/cp-sat-fun/issues/1), which obviously means the world to me.
- [The CP-SAT primer: Using and Understanding Google OR-Tools' CP-SAT Solver](https://d-krupke.github.io/cpsat-primer/): A great guide by Dominik Krupke, which I'd have loved to have when starting my journey.
