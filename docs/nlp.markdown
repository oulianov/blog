---
layout: post
title: "NLP"
date: 2025-01-04 17:55:06 +0100
categories:
---

Gosh. Do I love NLP.

# My story with NLP

NLP (Natural Language Processing) is a field of data science focused on solving tasks related to natural language, for example English or French. We try to make machines read human text and speech.

In 2020, I arrived in Berlin to work as a Data Science Intern for a [VC fund called Foundamental](https://www.foundamental.com). At the time, the VC fund wanted to crunch through thousands of startups to find the most promising ones, and use algorithms to do so. My project was about evaluating the quality of text descriptions of startups, based on annotated data.

I started first by building smart features: length of the description, percentage of English words, token diversity... Then I used the biggest XGBoost and tree models I knew of. But my performances plateaued at 70-inch percent of F1 score.

Then, I discovered BERT, Huggingface Transformers, and PyTorch. And I tried to use BERT embeddings and a Logistic Regression on top. The results crushed my hand made model, with more than 95% F1 score. This was the first time I really felt the cold truth of [the bitter lesson.](http://www.incompleteideas.net/IncIdeas/BitterLesson.html)

The issue? The BERT model was much bigger and slower than a few features and a tree. I spent the rest of my internship optimizing cloud deployments, data pipelines, and training scripts. That's how I discovered the world of software engineering and data engineering, which would give me a headstart when building my first startup.

Since then, I've worked on multiple projects related to NLP:

- At Criteo AI Labs, I've researched efficient deep learning models for contextually targeted ads. This approach was heavily inspired by word embeddings.
- As a freelancer, I've developed a model to find missing barcodes on products by referring to products with similar names and composition (Machine Learning, K-NN, NLP)
- At McKinsey QuantumBlack, I created a pipeline to model insurance policies based on their text contracts using LLMs.
- At Phospho, I've built [an open source text analytics platform](https://github.com/phospho-app/phospho) for logs of conversations with AI models.
