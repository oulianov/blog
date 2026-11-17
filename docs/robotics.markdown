---
layout: post
title: "Robotics"
nav_order: 5
date: 2026-11-17 00:00:00 +0100
categories:
---

# What's AI robotics?

A robot is just a Linux computer moving motors and sticks. For decades, you programmed those motors by hand: move this joint by 30 degrees, then that one by 12. It works great on a factory line, where nothing ever changes.

AI robotics is about letting a model decide how to move instead. You show the robot a task a few dozen times, by remote controlling it, and a neural network learns to do it on its own. This is called [imitation learning](https://en.wikipedia.org/wiki/Imitation_learning). The latest models, called VLAs (_Vision Language Action models_), look at camera images, read an instruction like "pick up the apple", and output movements. Think ChatGPT, but instead of words, it outputs motor positions.

The stack looks like this:

- **motors** that move the robot
- **communication** between your computer and those motors
- **teleoperation and data collection**, to record demonstrations
- **training** of the AI model, sometimes helped by **simulation**

Every layer has its own surprises. I discovered most of them the hard way.

# My story with robotics

In 2025, I was working as a founding engineer in a YC company. We built [phosphobot](https://github.com/phospho-app/phosphobot), an open source platform to control robots, record datasets and train VLA models like [ACT](https://tonyzhaozh.github.io/aloha/) or [GR00T](https://github.com/NVIDIA/Isaac-GR00T) on low-cost robot arms like the [SO-100](https://github.com/TheRobotStudio/SO-ARM100).

I graduated from an Engineering school called Télécom Paris. But I'm a Data Science engineer, not a Robotics engineer, and my knowledge of physics at the time was pretty basic. So I had to learn from scratch, by building in public and reaching out to builders from across the world on Discord.

At first, I thought the hard part would be training the AI models. I was wrong. The hard parts were everything around them: motors that are heavy, pricey and overheat, robots that each speak their own language, Wi-Fi that turns remote control into a networking problem, and data that's painfully slow to collect.

Here is what reality taught me, from the motors up to the data.

## Motors: the muscles are where it hurts

### Gears are everything

A robot is a collection of servomotors, which are motors that can hold a steady angle position. But how did they work?

So I took one apart. The Feetech STS3215, the servo inside the SO-100, is the most popular servomotor in open source robotics.

<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"><p lang="en" dir="ltr">What&#39;s inside?<br><br>Let&#39;s disassemble the Feetech STS3215.<br><br>It&#39;s the most popular servomotor for open source robotics.</p>&mdash; nicov (@nicolasoulianov) <a href="https://twitter.com/nicolasoulianov/status/1936008925129675111">June 20, 2025</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

Inside, there's:

1. a motor (duh),
2. a PID controller, to control the motor (more on this below),
3. an encoder, to know the motor's position,
4. and a **gearbox**.

The motor itself costs less than a dollar. It spins at 15,000 rotations per minute, which is great for a drone propeller and useless for a robot arm. The gearbox, with a ratio of 1:345, turns this into 45 rotations per minute: much slower, but with enough force to move stuff around and hold a position.

That's the real lesson: a raw electric motor spins fast and weak, a robot joint needs to move slow and strong, and the gearbox in between decides almost everything: weight, strength, precision, noise, price.

Moving a robot takes a lot of energy, because you're moving mass. And the motors are part of that mass: the shoulder motor carries the elbow motor, which carries the wrist motor, which carries the gripper. Add a gram at the end of the arm, and every motor before it has to be a bit stronger, so a bit heavier. A walking robot is even worse: at every step, it lifts all of its own motors.

It also has to be cheap. Robots are built to automate work, and a robot that costs more than the work it does is a nice demo, not a business. For the math to check out, a robot's muscles have to be light, strong and cheap to make.

For a long time, the way to get enough power to move a heavy robot was hydraulics: pumps pushing fluid into cylinders.

Take [BigDog](https://en.wikipedia.org/wiki/BigDog), the robotic pack mule Boston Dynamics built for the US military in 2005: a go-kart engine drove its hydraulic pump, it carried more than 150 kilograms over rough terrain, and it was so loud you could hear it from hundreds of meters away, which got the project shelved.

![Two BigDog robots walking on a tarmac, carrying loads, with their operator between them]({{ site.baseurl }}/assets/robotics/bigdog.jpg)

[Atlas](https://en.wikipedia.org/wiki/Atlas_(robot)), Boston Dynamics' humanoid, was hydraulic too. When it was unveiled in 2013, it stood 1.88 meters tall, weighed 150 kilograms, and was tethered to an external power supply.

![The hydraulic Atlas humanoid robot in 2013, with its hydraulic lines visible]({{ site.baseurl }}/assets/robotics/atlas-hydraulic.jpg){: width="400" }

Electric motors are quiet, clean and cheap, but they spin fast and weak, so it all comes down to the gearbox, and for a long time each kind came with a catch:

- **Spur gears**, chained one after the other: cheap, but noisy and imprecise. That's what's inside the Feetech.
- **[Harmonic drives](https://en.wikipedia.org/wiki/Strain_wave_gearing)**: a flexible ring squeezed by an oval cam. Very precise, with ratios up to about 1:320, but they can cost something like 20 times more. You find them in high-precision robots, like surgery robots.
- **[Cycloidal drives](https://en.wikipedia.org/wiki/Cycloidal_drive)**: not technically gears, but a wobbling disc. Almost no backlash (the little "play" when a joint changes direction), and they tolerate shocks well. But they're hard to manufacture, so you mostly find them in industrial robots.

<video autoplay loop muted playsinline style="display: block; max-height: 320px; max-width: 100%;" src="{{ site.baseurl }}/assets/robotics/cycloidal-drive.mp4"></video>

- **Capstan drives** use cables wound around drums instead of gears. Zero backlash, very smooth, and you can push the joint back by hand (they're _backdrivable_), which is great for robots working near humans. But the drums get bulky for high ratios.

Then came **[planetary gearboxes](https://en.wikipedia.org/wiki/Epicyclic_gearing)**: small gears orbiting around a central one, packed in a compact cylinder.

<img src="{{ site.baseurl }}/assets/robotics/planetary-gearbox.gif" alt="A planetary gearbox: small gears orbiting around a central one, inside a fixed ring" style="display: block; max-height: 320px; max-width: 100%;">

Paired with the [brushless motors](https://en.wikipedia.org/wiki/Brushless_DC_electric_motor) that drones made cheap, they make actuators that are light, strong and cheap. With a low ratio, between 1:3 and 1:10, the motor even feels the ground: when a leg lands, it gives way like a muscle instead of breaking the gearbox. That's the recipe behind [Unitree](https://www.unitree.com/)'s G1 humanoid.

<img src="{{ site.baseurl }}/assets/robotics/unitree-g1.jpg" alt="Unitree's G1 humanoid robot walking" style="display: block; max-height: 480px; max-width: 100%;">

The new Atlas from January 2026 uses planetary gears too, in the form of [planetary roller screws](https://en.wikipedia.org/wiki/Roller_screw): it stands at the same 1.9 meters as the 2013 one but weighs 90 kilograms, 60 less, and runs on a battery instead of a cable.

<img src="{{ site.baseurl }}/assets/robotics/atlas-electric.jpg" alt="The electric Atlas humanoid robot by Boston Dynamics, standing in front of a small soccer goal" title="Photo: Damian B Oh, CC BY-SA 4.0" style="display: block; max-height: 480px; max-width: 100%;">

Lighter muscles make lighter robots, with more power, at a price factories can pay. Gears are everything.

### Heat: holding still is the hardest job

I thought the hard part for a motor was moving. Turns out, the hard part is **staying in place**.

Picture holding a bottle of water at arm's length. You're not moving, yet after a minute your arm is shaking. A servo holding a robot arm horizontally is in the same situation: it fights gravity constantly, current flows through its windings, and the windings heat up.

Now cram several of these servos in a small arm, with no room for air. They overheat. When a Feetech servo overheats or stays overloaded for too long, it protects itself: its torque drops to a fraction of its strength. Your arm suddenly sags, mid-task, in the middle of recording a dataset.

Did I mention that batteries can also overheat and explode? Especially in the outdoors.

### PID: the art of not shaking

So how does a servo hold still in the first place? It doesn't just "stay there". It runs a control loop hundreds of times per second, called a [PID controller](https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller).

Here is the idea, in plain words:

- **P (proportional)**: the further you are from the target, the harder you push.
- **I (integral)**: if you've been a bit off for a while, push a bit more. This fixes the arm that sags slightly under gravity.
- **D (derivative)**: if you're approaching the target fast, brake before you overshoot.

PID comes from [control theory](https://en.wikipedia.org/wiki/Control_theory), the math of making a system reach a target. You describe the system with an equation about how things change over time (with derivatives), and you solve it to predict how it will behave. For example, a joint pushed only by the P term behaves like a spring: its acceleration $$\ddot\theta$$ pulls it back toward the target angle $$\theta^*$$, so $$\ddot\theta = -k\,(\theta - \theta^*)$$. Starting at rest, the solution is $$\theta(t) = \theta^* + A\cos(\sqrt{k}\,t)$$: the joint swings around the target forever. That's why you need the D term, to brake.

![Joint angle over time: with P only, the joint swings around the target forever; with P and D, the swings shrink and it settles on the target]({{ site.baseurl }}/assets/robotics/pid-spring.svg)

Each robot, each joint, each payload needs its own tuning. It's very specific, hands-on work.

## Talking to robots

### Documentation is a luxury

Working with web frameworks like React, TanStack and Next.js, I was used to good docs. An API has a reference, examples, an SDK.

Robots have a price gradient. Expensive motors and robots, like those from Boston Dynamics, come with the best documentation, which makes them easy to work with. Cheap Chinese motors come with... not much. A low-level interface, a memory table of registers, and trial and error. The reference for the SO-100's servo memory table is a shared spreadsheet.

And here is the thing about trial and error with hardware: errors are physical. Send the wrong value to the wrong register, and you burn a motor. Plug a broken AI model into a real robot, and it may slam the table, pinch your fingers, or break a small part. A small, very expensive part. Four-times-your-rent expensive. I may or may not be speaking from experience.

Anyways, robotics also teaches you how to reach out to customer support, explain your problem in simple English, and follow approximately-translated Chinese instructions. Everyone in the community I've interacted with was super nice. Robotics engineers have infinite patience.

### Every robot speaks its own language

When we added support for more robots, I realized there's no common language at all:

- the SO-100 talks over a serial port at 1,000,000 bauds,
- the AgileX Piper arm talks over a [CAN bus](https://en.wikipedia.org/wiki/CAN_bus), like the inside of a car,
- the Unitree Go2 robot dog talks over WebRTC, like a video call.

[LeCabot](https://github.com/phospho-app/lecabot), the open source mobile manipulator we built, speaks two of these languages at once: an SO-100 arm over serial, mounted on a Go2 dog over WebRTC, both controlled at the same time.

### ROS 2 is not the standard you think

"But there's ROS!" I hear you say. [ROS 2](https://docs.ros.org/) (Robot Operating System) is the most famous framework in robotics. I had heard so much about it that I assumed it was _the_ standard that solves all of this.

It's not. ROS 2 is a set of tools to pass messages between programs. It's tedious to set up, and it won't give you an AI: you still solve everything yourself. And it's not even a standard between robots.

Saying a robot is "ROS compatible" is like saying a server is "API compatible". Sure, it speaks HTTP. You still need to read the schema to do anything with it.

## Teleoperation: a networking problem in disguise

To train a robot with imitation learning, you need demonstrations: a human remote controls the robot (_teleoperation_) while you record everything.

I thought controlling a robot remotely was a robotics problem. It's a networking problem. Very similar to online multiplayer games.

<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"><p lang="en" dir="ltr">Agilex Piper VR control with Meta Quest and <a href="https://twitter.com/phospho_ai">@phospho_ai</a></p>&mdash; nicov (@nicolasoulianov) <a href="https://twitter.com/nicolasoulianov/status/1968981689633263893">September 19, 2025</a></blockquote>

### TCP vs UDP, and why old commands must die

Our first control page was basically a TV remote made with HTML and CSS. The natural way to send its commands from a web page is a WebSocket. But picture the Wi-Fi hiccupping: the robot freezes, then performs several moves in a row, very fast, to catch up. Not great when you're recording a dataset.

You see, a WebSocket runs on [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol). TCP guarantees that every message arrives, in order. If one packet gets lost, every following packet waits for it to be sent again. This is called [head-of-line blocking](https://en.wikipedia.org/wiki/Head-of-line_blocking). For a chat app, that's what you want. For a robot, it's a disaster: you don't care about where the operator's hand was 300 milliseconds ago. You care about where it is _now_.

So we also accepted commands over [UDP](https://en.wikipedia.org/wiki/User_Datagram_Protocol), which doesn't wait for lost packets, and stamped every command with the time it was sent. A command older than the last one received, or older than a second, is simply thrown away: the operator has already moved on.

### Latency is a feeling

I thought lower latency meant easier teleoperation, which meant better datasets. That's true, but it's only half the story.

Like in video games, there are tricks to make latency _feel_ lower without actually lowering it. What makes a robot pleasant to control is:

- **predictability**: the robot does what you expect, every time,
- **low jitter**: a steady 50 ms beats a delay jumping between 10 and 200 ms,
- **graceful disconnects and reconnects**: Wi-Fi drops, and the robot shouldn't go crazy when it does,
- **feedback**: feeling (or at least seeing) when the gripper touches something.

An operator who enjoys controlling the robot records smoother, more consistent demonstrations. And smoother demonstrations make better models.

### Video: rebuilding Google Meet for robots

Commands are tiny. Video is not. And the AI model needs the camera feeds, ideally from several angles.

Over unreliable Wi-Fi, the right tool is [WebRTC](https://webrtc.org/), the technology behind video calls: it adapts the video quality to the network and drops late frames instead of piling them up. Doing robot teleoperation well basically means rebuilding Google Meet, with a robot on the other end of the call.

## How robots learned to move

As I understand it, robotics models went through three eras: first we wrote the equations, then robots practiced in simulation, and now they learn from real data. Each era changed what a simulation is for.

### 1. Physics equations

For decades, you modeled the robot as a [dynamical system](https://en.wikipedia.org/wiki/Dynamical_system) and solved the equations properly, like the PID controller above. In this era, a simulation is where you check your math before you try it on the real robot.

We used [PyBullet](https://pybullet.org/). It's older, but it comes with batteries included, inverse kinematics among them (more on that below). [MuJoCo](https://mujoco.org/) is very active and increasingly GPU-oriented, but barebones: there's no built-in inverse kinematics, so you solve it yourself, and figure out yourself whether it works.

To simulate a robot, you describe it in a file: [URDF](https://wiki.ros.org/urdf) (from the ROS world) or [MJCF](https://mujoco.readthedocs.io/en/stable/XMLreference.html) (MuJoCo's format). A URDF lists the robot's parts and how they're connected:

```xml
<joint name="shoulder_pan" type="revolute">
  <parent link="base"/>
  <child link="shoulder"/>
  <origin xyz="0 0 0.05" rpy="0 0 0"/>
  <axis xyz="0 0 1"/>
  <limit lower="-2.0" upper="2.0" effort="3.0" velocity="5.0"/>
</joint>
```

_A simplified joint, with illustrative values._

I thought a URDF was the robot's digital twin. It's more like a stick figure. It says nothing about the materials, the friction, the backlash of the gears, or how the motor heats up. Most URDFs are generated automatically from CAD software, then tuned by hand until the simulated robot behaves like the real one.

And not every simulator reads URDF the same way. Saying "my robot has a URDF" is like saying "my config is in TOML". It tells you the syntax, not what's inside, nor how each tool will interpret it.

URDFs are still useful for inverse kinematics, because a stick figure is exactly what it needs.

Picture controlling a puppet. You want its hand to touch a specific spot, but you can't move the hand directly: you can only pull strings. [Inverse kinematics](https://en.wikipedia.org/wiki/Inverse_kinematics) is the math problem that turns "put the hand here" into "pull these strings this much", or for a robot, "rotate each joint this many degrees".

It's the physics-equations era in a nutshell: compute the joint angles with geometry, then let the PID hold them. It's not a silver bullet: some targets have several solutions, some can't be reached at all, and a real robot can fall or hit itself switching between positions.

### 2. Reinforcement learning in simulation

Then came [reinforcement learning](https://en.wikipedia.org/wiki/Reinforcement_learning). Instead of writing the equations of walking, you let a virtual robot try millions of times, and reward it when it succeeds. The simulation stops being a place to check your math. It becomes a gym.

That's how robot dogs learned to walk. In this video from ETH Zurich, thousands of virtual robots learn to walk at the same time, on a single GPU, in minutes:

{% include youtubePlayer.html id="8sO7VS3q8d0" %}

NVIDIA bet big on this era: its GPUs simulate thousands of robots in parallel, and its stack ([Isaac Lab](https://github.com/isaac-sim/IsaacLab), [GR00T](https://github.com/NVIDIA/Isaac-GR00T)) is open and powerful. GR00T, its open model for humanoid robots, even learns partly from demonstrations generated in simulation instead of recorded by humans. The stack is very efficient at doing exactly what NVIDIA had in mind. Step off that path, and you're on your own.

The catch is the stick figure. A model that only ever lived in a simulation meets real friction, real backlash and real heat for the first time on the real robot: that's the _sim-to-real gap_. Walking crosses it well, because the reward is simple (move forward, don't fall). Folding a T-shirt is another story: try writing the equations of cloth, or a reward for "nicely folded".

### 3. Learning from real data and generalization

So the field turned to real data. Today's VLAs, and models like ACT, learn from human demonstrations, like the ones we recorded with teleoperation. Simulation is still useful, to test things without breaking a real robot, but it's no longer the only path.

Learning one task from 50 demonstrations works. The hard part is **generalization**: a robot that folds a shirt it has never seen, in a home it has never been in, from an instruction it has never heard. That's the trillion-dollar problem that [Physical Intelligence](https://www.physicalintelligence.company/), [Gemini Robotics](https://deepmind.google/models/gemini-robotics/) and OpenAI are racing to crack.

To crack it, we'll need far more robot data than anyone has today. And that's where it hurts.

#### The data scale problem

Here's the elephant in the room. ChatGPT was trained on the whole internet. Robotics AI models have... almost nothing. There's no internet of robot movements.

"Can't we scale teleoperation?" That's like scaling book production with more monks copying books. It works, slowly.

"Can't we use simulations?" Making a proper simulation is harder than collecting real life data (remember the stick figure).

"Can't we use videos of humans?" Sure, but why would someone wear a GoPro 24/7 and send you everything they're doing?

#### Cheap hardware, more annotators

For a while, the reference setup to record demonstrations was [ALOHA](https://tonyzhaozh.github.io/aloha/), with leader arms that a human moves by hand. It's open source and brilliant, and it costs around $20,000.

![The ALOHA 2 bimanual robot setup: two robot arms facing each other on a table, with cameras on a frame above]({{ site.baseurl }}/assets/robotics/aloha-setup.jpg)

The cheapest lever I found: cheap hardware. A low-cost arm like the SO-100, and a $300 VR headset that tracks your hands. Cheaper teleop hardware means a bigger pool of people who can record data, and more volume.

That's also the idea behind LeCabot: cheap robots, lots of data, better AI, then run that AI on the expensive robots.

<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"><p lang="en" dir="ltr">Spot by Boston dynamics cost 75,000$.<br><br>By contrast, this is LeCabot.<br><br>It costs 135$ and basically does the same thing.</p>&mdash; nicov (@nicolasoulianov) <a href="https://twitter.com/nicolasoulianov/status/1931041702241832992">June 6, 2025</a></blockquote>

#### Auditable, streamable data

Datasets need to be auditable: who recorded each episode, when, with which robot, which cameras. Timestamps on everything, again. When a model fails, you want to trace it back to the data.

We recorded datasets in the [LeRobot](https://github.com/huggingface/lerobot) format: one Parquet file per episode for the joint positions, and one MP4 video per camera. Videos are compressed and easy to share. The downside: training needs to decode them, and decoding on the CPU with ffmpeg quickly becomes the bottleneck. This changed in late 2024, when the PyTorch team released [torchcodec](https://github.com/pytorch/torchcodec): it decodes videos directly on the GPU, without the round trip through the CPU.

#### Make it fun

Recording the same movement 50 times with slight variations is not fun.

<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true"><p lang="en" dir="ltr">Thoughts from a teleop session today:<br><br>1/ Teleop is painful.</p>&mdash; Dominique Paul (@DominiqueCAPaul) <a href="https://twitter.com/DominiqueCAPaul/status/2042986384223338520">April 11, 2026</a></blockquote>

Many companies try to solve this with money: they pay people to record data, and sell them cheap knockoff hardware. Meta took another angle with its smart glasses: make wearing a camera fashionable. Collecting robotics data at the scale we need won't only take a shift in technology. It will take a shift in society.
