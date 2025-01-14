---
layout: post
title: "LLM Colosseum"
date: 2025-01-14 17:55:06 +0100
categories:
---

# LLM Colosseum

Make LLM fight each other in real time in Street Fighter III. Which LLM will be the best fighter?

{% include youtubePlayer.html id="Z4tA_VSOTvQ" %}

- Demo: [Try it in your browser right here!](https://llm-colosseum.phospho.ai)
- Github: [1.4K stars repo](https://github.com/OpenGenerativeAI/llm-colosseum)

This page is about the story behind this project, from my perspective.

## The hackathon story

### Genesis

In March 2024, I took part to the Mistral AI hackathon in San Francisco with Pierre-Louis Biojout, Paul-Louis Venard, and Stan Girard.

All of us were part of the YCombinator program and were super tired. So, to wind down, we decided to have some fun at the Mistral hackathon and represent France the best we could.

We pitched several ideas and finally settled for LLMs playing video games, because it was visual and fun. First, we wanted to have LLM play [Trackmania](https://github.com/trackmania-rl/tmrl), but we didn't have Windows computers. Pierre-Louis found out about [Diambra](https://github.com/diambra/arena), a module to make RL agents play in arcade combat games. I set it up with Street Fighter, which was the only supported game I knew about.

The first prompt system was written by Paul-Louis. I implemented the combo system, the multiprocessing, the image processing, and refacto'd everything 10 times.

{% include youtubePlayer.html id="R7F_w_eWC8A" %}

### Vision

A popular benchmark for LLMs at the time was [Chatbot Arena](https://lmarena.ai), a website where you ask questions to two LLMs at the same time and they compete for the best answer. To poke some fun at them, we named our project _LLM Colosseum_ and decided to copy them as much as possible.

Stan Girard was the one that came up with the vision that "LLM Colosseum is the new benchmark for LLMs" and wrote the github README and tweets. Pierre-Louis Biojout wrote the notebook to compute ELO scores on compiled results.

### Celcius

There were free Celcius energy drinks at the event. I think I drank about a dozen over two days. Since then, they hold a special place in my hearth.

![Google scholars]({{ site.baseurl }}/assets/celcius.jpg)

### Results

We didn't win anything at the hackathon.

Indeed, a much more impressive [fine-tuned Mistral](https://github.com/umuthopeyildirim/DOOM-Mistral) and a similar [Mistral playing Pacman](https://devpost.com/software/ai-vision-pacman-agent) were featured.

Or you know, maybe, just maybe, it was because the GPT-3.5 model by OpenAI was better than the Mistral-7b model on our benchmark...

No... Come on, that's just a silly coincidence ;)

![Win rate matrix](https://github.com/OpenGenerativeAI/llm-colosseum/blob/a9f31b72289a668a799f99a60f06b2f68ff16f06/notebooks/win_rate_matrix.png?raw=true)

## Aftermatch

After the hackathon, this project received unexpected echo on social media.

Turns out people loved Street Fighter and loved LLM fighting to be the best one!

Here is a compilation of some of the cool stuff people said about it.

### Youtube

The project was highlighted by Matthew Berman (370K followers) and the channel "All about AI" (180K followers). Thank you both!

{% include youtubePlayer.html id="CGV0MlnOd30" %}

{% include youtubePlayer.html id="yHAwh_tNMLc" %}

### Diambra docs

Alessandro Palmas, the creator of Diambra, was super supportive and we got featured in the [docs.](https://docs.diambra.ai/projects/llmcolosseum/). I also made a small PR to the [codebase.](https://github.com/diambra/cli/pull/53) Thank you Alessandro!

![Google scholars]({{ site.baseurl }}/assets/diambra.png)

The great montage I made of Arthur Mensch (Mistral founder) is now immortalized.

### Press

While boarding on a plane to Las Vegas, I replied to questions from journalist Matthew Connatser on Linkedin. He actually [wrote an article](https://www.theregister.com/2024/04/11/chatgpt_claude_street_fighter_3/) for the UK magazine _The Register._

Fun fact : This article got copy and pasted on dozens of websites, and was even [translated in Chinese](https://chatgptchina.xyz/articles/1712869246719.html).

Nick Evanson also published [a story in PC Gamer](https://www.pcgamer.com/software/ai/openais-gpt-35-is-the-champion-of-the-street-fighter-iii-llm-colosseum-beating-mistral-on-its-home-turf/) about our project.

### Google scholars

We were quoted in a [preprint of a paper about particle accelerators](https://arxiv.org/pdf/2405.08888) by Jan Kaiser et al. from the Hamburg University of Technology, as an demonstration of "LLMs used in Reinforcement Learning"

![Google scholars]({{ site.baseurl }}/assets/google_scholar.png)

![Google scholars]({{ site.baseurl }}/assets/physics.jpeg)

### AWS

Banjo Obayomi from Amazon Web Services cloned the repo and made it run on all the models from AWS Bedrock, the AWS solution for AI. [He wrote a blog post](https://community.aws/content/2dbNlQiqKvUtTBV15mHBqivckmo/14-llms-fought-314-street-fighter-matches-here-s-who-won?lang=en) about that and got funny results, like Claude 2.1 refusing to fight.

> _"I apologize, upon reflection I do not feel comfortable recommending violent actions or strategies, even in a fictional context."_ - Claude 2.1

### Groq

The [Groq](https://groq.com) twitter account [released a video](https://x.com/GroqInc/status/1790530402840400042) of an OpenAI model fighting a Gemma 7b on Groq in Street Fighter, to showcase the speed of Groq chips.

I later worked with Sarit Schube and Mark Heaps from Groq [to release the web version](https://llm-colosseum.phospho.ai) of LLM Colosseum. Great people, thank you for their support!

![Groq]({{ site.baseurl }}/assets/groq.png)

## Personal comment

I'm still amazed by how much people vibed with this project.

Some saw an entertaining story, some an opportunity for business, some an inspiration for science...

It's wild that this concept of "LLM fighting in Street Fighter" caught the attention of so many people. Even though, you know, they fight pretty badly lol. I'm thrilled to see programmers from everywhere take the code I wrote and do their own thing!

This is the magic of open source.

I still maintain [the repo](https://github.com/OpenGenerativeAI/llm-colosseum), so feel free to contribute. If you want to be featured on this page, feel free to reach out as well!
