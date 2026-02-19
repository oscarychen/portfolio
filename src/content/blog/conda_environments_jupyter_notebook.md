---
title: "Using Conda environments in Jupyter Notebook"
description: ""
pubDate: "Aug 23 2021"
---

Create a Conda environment
`conda create -n py38 python=3.8`

Activate the environment
`conda activate py38`

Install ipykernel
`pip install --user ipykernel`

Add the envrionment to Jupyter
`python -m ipykernel install --user --name=py38`

To remove the conda environment
`conda env remove -n py38`

To remove the conda environment from Jupyter
`jupyter kernelspec uninstall py38`
